from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.detalle_gastos import DetalleGasto
from app.schemas.detalle_gastos import DetalleGastoSchema
from typing import List

router = APIRouter()

@router.get("/detalles-gastos")
def obtener_detalles_gastos(db: Session = Depends(get_db)):
    """Obtener todos los detalles de gastos"""
    detalles = db.query(DetalleGasto).all()
    return [
        {
            "id": detalle.id,
            "id_trabajo": detalle.id_trabajo,
            "descripcion": detalle.descripcion,
            "monto": float(detalle.monto),
            "monto_cobrado": float(detalle.monto_cobrado) if detalle.monto_cobrado else None
        }
        for detalle in detalles
    ]

@router.put("/detalle_gastos/{id_gasto}")
def actualizar_detalle_gasto(id_gasto: int, gasto_update: DetalleGastoSchema, db: Session = Depends(get_db)):
    gasto_db = db.query(DetalleGasto).filter(DetalleGasto.id == id_gasto).first()
    if not gasto_db:
        raise HTTPException(status_code=404, detail="Detalle de gasto no encontrado")

    gasto_db.descripcion = gasto_update.descripcion
    gasto_db.monto = gasto_update.monto

    db.commit()
    return {"message": "Detalle de gasto actualizado correctamente"}
