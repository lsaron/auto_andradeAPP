from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import get_db
from app.models.gastos_taller import GastoTaller as GastoTallerModel
from app.schemas.gastos_taller import GastoTallerCreate, GastoTallerUpdate, GastoTaller
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/gastos-taller", tags=["gastos-taller"])

@router.post("/", response_model=GastoTaller)
def crear_gasto_taller(gasto: GastoTallerCreate, db: Session = Depends(get_db)):
    """Crear un nuevo gasto del taller"""
    try:
        db_gasto = GastoTallerModel(
            descripcion=gasto.descripcion,
            monto=gasto.monto,
            categoria=gasto.categoria,
            fecha_gasto=gasto.fecha_gasto
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

@router.get("/estadisticas/resumen")
def obtener_estadisticas_gastos(
    fecha_inicio: Optional[datetime] = Query(None),
    fecha_fin: Optional[datetime] = Query(None),
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
