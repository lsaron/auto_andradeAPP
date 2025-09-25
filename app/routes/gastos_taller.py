from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import get_db
from app.models.gastos_taller import GastoTaller as GastoTallerModel, EstadoGasto
from app.schemas.gastos_taller import GastoTallerCreate, GastoTallerUpdate, GastoTaller, EstadoGasto as EstadoGastoSchema
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/gastos-taller", tags=["gastos-taller"])

@router.post("/", response_model=GastoTaller)
def crear_gasto_taller(gasto: GastoTallerCreate, db: Session = Depends(get_db)):
    """Crear un nuevo gasto del taller"""
    try:
        # Si el gasto se crea como PAGADO, establecer fecha_pago igual a fecha_gasto
        fecha_pago = None
        if gasto.estado == EstadoGasto.PAGADO:
            fecha_pago = gasto.fecha_gasto
        
        db_gasto = GastoTallerModel(
            descripcion=gasto.descripcion,
            monto=gasto.monto,
            categoria=gasto.categoria,
            fecha_gasto=gasto.fecha_gasto,
            fecha_pago=fecha_pago,
            estado=gasto.estado
        )
        db.add(db_gasto)
        db.commit()
        db.refresh(db_gasto)
        return db_gasto
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear gasto: {str(e)}")

@router.get("/", response_model=List[GastoTaller])
def listar_gastos_taller(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    categoria: Optional[str] = Query(None),
    estado: Optional[EstadoGastoSchema] = Query(None),
    fecha_inicio: Optional[datetime] = Query(None),
    fecha_fin: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Listar gastos del taller con filtros opcionales"""
    try:
        query = db.query(GastoTallerModel)
        
        # Aplicar filtros
        if categoria:
            query = query.filter(GastoTallerModel.categoria.ilike(f"%{categoria}%"))
        
        if estado:
            query = query.filter(GastoTallerModel.estado == estado)
        
        if fecha_inicio:
            query = query.filter(GastoTallerModel.fecha_gasto >= fecha_inicio)
        
        if fecha_fin:
            query = query.filter(GastoTallerModel.fecha_gasto <= fecha_fin)
        
        # Ordenar por fecha más reciente
        query = query.order_by(GastoTallerModel.fecha_gasto.desc())
        
        # Aplicar paginación
        gastos = query.offset(skip).limit(limit).all()
        return gastos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar gastos: {str(e)}")

@router.get("/{gasto_id}", response_model=GastoTaller)
def obtener_gasto_taller(gasto_id: int, db: Session = Depends(get_db)):
    """Obtener un gasto específico por ID"""
    try:
        gasto = db.query(GastoTallerModel).filter(GastoTallerModel.id == gasto_id).first()
        if not gasto:
            raise HTTPException(status_code=404, detail="Gasto no encontrado")
        return gasto
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener gasto: {str(e)}")

@router.put("/{gasto_id}", response_model=GastoTaller)
def actualizar_gasto_taller(gasto_id: int, gasto: GastoTallerUpdate, db: Session = Depends(get_db)):
    """Actualizar un gasto existente"""
    try:
        db_gasto = db.query(GastoTallerModel).filter(GastoTallerModel.id == gasto_id).first()
        if not db_gasto:
            raise HTTPException(status_code=404, detail="Gasto no encontrado")
        
        # Actualizar solo los campos proporcionados
        update_data = gasto.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_gasto, field, value)
        
        db_gasto.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_gasto)
        return db_gasto
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar gasto: {str(e)}")

@router.delete("/{gasto_id}")
def eliminar_gasto_taller(gasto_id: int, db: Session = Depends(get_db)):
    """Eliminar un gasto"""
    try:
        db_gasto = db.query(GastoTallerModel).filter(GastoTallerModel.id == gasto_id).first()
        if not db_gasto:
            raise HTTPException(status_code=404, detail="Gasto no encontrado")
        
        db.delete(db_gasto)
        db.commit()
        return {"message": "Gasto eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar gasto: {str(e)}")

@router.patch("/{gasto_id}/estado", response_model=GastoTaller)
def cambiar_estado_gasto(
    gasto_id: int, 
    request_data: dict,
    db: Session = Depends(get_db)
):
    """Cambiar el estado de un gasto (PENDIENTE o PAGADO)"""
    try:
        db_gasto = db.query(GastoTallerModel).filter(GastoTallerModel.id == gasto_id).first()
        if not db_gasto:
            raise HTTPException(status_code=404, detail="Gasto no encontrado")
        
        # Obtener el nuevo estado del request body
        nuevo_estado_str = request_data.get('nuevo_estado')
        if not nuevo_estado_str:
            raise HTTPException(status_code=400, detail="Campo 'nuevo_estado' es requerido")
        
        # Validar que el estado sea válido
        if nuevo_estado_str not in ['PENDIENTE', 'PAGADO']:
            raise HTTPException(status_code=400, detail="Estado debe ser 'PENDIENTE' o 'PAGADO'")
        
        # Convertir el string al enum del modelo
        estado_modelo = EstadoGasto(nuevo_estado_str)
        db_gasto.estado = estado_modelo
        
        # Si se cambia a PAGADO, establecer fecha_pago a la fecha actual
        if estado_modelo == EstadoGasto.PAGADO and db_gasto.fecha_pago is None:
            db_gasto.fecha_pago = datetime.utcnow()
        # Si se cambia a PENDIENTE, limpiar fecha_pago
        elif estado_modelo == EstadoGasto.PENDIENTE:
            db_gasto.fecha_pago = None
        
        db_gasto.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_gasto)
        return db_gasto
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al cambiar estado del gasto: {str(e)}")

@router.get("/estadisticas/resumen")
def obtener_estadisticas_gastos(
    fecha_inicio: Optional[datetime] = Query(None),
    fecha_fin: Optional[datetime] = Query(None),
    solo_pagados: bool = Query(True, description="Incluir solo gastos pagados en las estadísticas"),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de gastos del taller"""
    try:
        query = db.query(GastoTallerModel)
        
        # Aplicar filtros de fecha si se proporcionan
        if fecha_inicio:
            query = query.filter(GastoTallerModel.fecha_gasto >= fecha_inicio)
        if fecha_fin:
            query = query.filter(GastoTallerModel.fecha_gasto <= fecha_fin)
        
        # Filtrar por estado si se solicita solo gastos pagados
        if solo_pagados:
            query = query.filter(GastoTallerModel.estado == EstadoGasto.PAGADO)
        
        # Calcular estadísticas
        total_gastos = query.count()
        total_monto = db.query(func.sum(GastoTallerModel.monto)).filter(query.whereclause).scalar() or 0
        
        # Gastos por categoría
        gastos_por_categoria = db.query(
            GastoTallerModel.categoria,
            func.count(GastoTallerModel.id).label('cantidad'),
            func.sum(GastoTallerModel.monto).label('total')
        ).filter(query.whereclause).group_by(GastoTallerModel.categoria).all()
        
        return {
            "total_gastos": total_gastos,
            "total_monto": float(total_monto),
            "gastos_por_categoria": [
                {
                    "categoria": item.categoria,
                    "cantidad": item.cantidad,
                    "total": float(item.total)
                }
                for item in gastos_por_categoria
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")
