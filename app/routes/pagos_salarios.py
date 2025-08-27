from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import get_db
from app.models.pagos_salarios import PagoSalario as PagoSalarioModel
from app.models.mecanicos import Mecanico as MecanicoModel
from app.schemas.pagos_salarios import PagoSalarioCreate, PagoSalarioUpdate, PagoSalario
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/pagos-salarios", tags=["pagos-salarios"])

@router.post("/", response_model=PagoSalario)
def crear_pago_salario(pago: PagoSalarioCreate, db: Session = Depends(get_db)):
    """Crear un nuevo pago de salario"""
    try:
        # Verificar que el mecánico existe
        mecanico = db.query(MecanicoModel).filter(MecanicoModel.id == pago.id_mecanico).first()
        if not mecanico:
            raise HTTPException(status_code=404, detail="Mecánico no encontrado")
        
        db_pago = PagoSalarioModel(
            id_mecanico=pago.id_mecanico,
            monto_salario=pago.monto_salario,
            semana_pago=pago.semana_pago,
            fecha_pago=pago.fecha_pago
        )
        db.add(db_pago)
        db.commit()
        db.refresh(db_pago)
        
        # Agregar nombre del mecánico para la respuesta
        db_pago.nombre_mecanico = mecanico.nombre
        return db_pago
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear pago de salario: {str(e)}")

@router.get("/", response_model=List[PagoSalario])
def listar_pagos_salarios(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    id_mecanico: Optional[int] = Query(None),
    semana_pago: Optional[str] = Query(None),
    fecha_inicio: Optional[datetime] = Query(None),
    fecha_fin: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Listar pagos de salarios con filtros opcionales"""
    try:
        query = db.query(PagoSalarioModel).join(MecanicoModel)
        
        # Aplicar filtros
        if id_mecanico:
            query = query.filter(PagoSalarioModel.id_mecanico == id_mecanico)
        
        if semana_pago:
            query = query.filter(PagoSalarioModel.semana_pago == semana_pago)
        
        if fecha_inicio:
            query = query.filter(PagoSalarioModel.fecha_pago >= fecha_inicio)
        
        if fecha_fin:
            query = query.filter(PagoSalarioModel.fecha_pago <= fecha_fin)
        
        # Ordenar por fecha más reciente
        query = query.order_by(PagoSalarioModel.fecha_pago.desc())
        
        # Aplicar paginación
        pagos = query.offset(skip).limit(limit).all()
        
        # Agregar nombres de mecánicos
        for pago in pagos:
            pago.nombre_mecanico = pago.mecanico.nombre
        
        return pagos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar pagos: {str(e)}")

@router.get("/{pago_id}", response_model=PagoSalario)
def obtener_pago_salario(pago_id: int, db: Session = Depends(get_db)):
    """Obtener un pago específico por ID"""
    try:
        pago = db.query(PagoSalarioModel).join(MecanicoModel).filter(PagoSalarioModel.id == pago_id).first()
        if not pago:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        
        pago.nombre_mecanico = pago.mecanico.nombre
        return pago
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener pago: {str(e)}")

@router.put("/{pago_id}", response_model=PagoSalario)
def actualizar_pago_salario(pago_id: int, pago: PagoSalarioUpdate, db: Session = Depends(get_db)):
    """Actualizar un pago existente"""
    try:
        db_pago = db.query(PagoSalarioModel).filter(PagoSalarioModel.id == pago_id).first()
        if not db_pago:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        
        # Actualizar solo los campos proporcionados
        update_data = pago.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_pago, field, value)
        
        db.commit()
        db.refresh(db_pago)
        
        # Agregar nombre del mecánico para la respuesta
        mecanico = db.query(MecanicoModel).filter(MecanicoModel.id == db_pago.id_mecanico).first()
        db_pago.nombre_mecanico = mecanico.nombre if mecanico else "Mecánico"
        
        return db_pago
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar pago: {str(e)}")

@router.delete("/{pago_id}")
def eliminar_pago_salario(pago_id: int, db: Session = Depends(get_db)):
    """Eliminar un pago"""
    try:
        db_pago = db.query(PagoSalarioModel).filter(PagoSalarioModel.id == pago_id).first()
        if not db_pago:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        
        db.delete(db_pago)
        db.commit()
        return {"message": "Pago eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar pago: {str(e)}")

@router.get("/estadisticas/resumen")
def obtener_estadisticas_pagos(
    fecha_inicio: Optional[datetime] = Query(None),
    fecha_fin: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de pagos de salarios"""
    try:
        query = db.query(PagoSalarioModel)
        
        # Aplicar filtros de fecha si se proporcionan
        if fecha_inicio:
            query = query.filter(PagoSalarioModel.fecha_pago >= fecha_inicio)
        if fecha_fin:
            query = query.filter(PagoSalarioModel.fecha_pago <= fecha_fin)
        
        # Calcular estadísticas
        total_pagos = query.count()
        total_salarios = db.query(func.sum(PagoSalarioModel.monto_salario)).filter(query.whereclause).scalar() or 0
        
        # Pagos por mecánico
        pagos_por_mecanico = db.query(
            PagoSalarioModel.id_mecanico,
            MecanicoModel.nombre,
            func.count(PagoSalarioModel.id).label('cantidad'),
            func.sum(PagoSalarioModel.monto_salario).label('total')
        ).join(MecanicoModel).filter(query.whereclause).group_by(
            PagoSalarioModel.id_mecanico, MecanicoModel.nombre
        ).all()
        
        return {
            "total_pagos": total_pagos,
            "total_salarios": float(total_salarios),
            "pagos_por_mecanico": [
                {
                    "id_mecanico": item.id_mecanico,
                    "nombre_mecanico": item.nombre,
                    "cantidad": item.cantidad,
                    "total": float(item.total)
                }
                for item in pagos_por_mecanico
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")
