from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.detalle_gastos import DetalleGasto
from app.schemas.detalle_gastos import DetalleGastoSchema

router = APIRouter()

@router.put("/detalle_gastos/{id_gasto}")
def actualizar_detalle_gasto(id_gasto: int, gasto_update: DetalleGastoSchema, db: Session = Depends(get_db)):
    gasto_db = db.query(DetalleGasto).filter(DetalleGasto.id == id_gasto).first()
    if not gasto_db:
        raise HTTPException(status_code=404, detail="Detalle de gasto no encontrado")

    gasto_db.descripcion = gasto_update.descripcion
    gasto_db.monto = gasto_update.monto

    db.commit()
    return {"message": "Detalle de gasto actualizado correctamente"}
