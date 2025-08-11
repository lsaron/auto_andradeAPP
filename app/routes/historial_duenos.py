from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.historial_duenos import HistorialDueno
from app.schemas.historial_duenos import HistorialDuenoSchema
from app.models.clientes import Cliente
from app.models.carros import Carro
from datetime import datetime

router = APIRouter()

@router.post("/historial_duenos/cambiar_dueno")
def cambiar_dueno_carro(data: HistorialDuenoSchema, db: Session = Depends(get_db)):
    carro = db.query(Carro).filter(Carro.matricula == data.matricula_carro).first()
    if not carro:
        raise HTTPException(status_code=404, detail="Carro no encontrado")

    nuevo_dueno = db.query(Cliente).filter(Cliente.id_nacional == data.id_cliente).first()
    if not nuevo_dueno:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # ✅ Cerrar el historial del dueño actual (si existe)
    if carro.id_cliente_actual:
        ultimo_historial = (
            db.query(HistorialDueno)
            .filter(
                HistorialDueno.matricula_carro == carro.matricula,
                HistorialDueno.id_cliente == carro.id_cliente_actual,
                HistorialDueno.fecha_fin == None
            )
            .order_by(HistorialDueno.fecha_inicio.desc())
            .first()
        )
        if ultimo_historial:
            ultimo_historial.fecha_fin = datetime.utcnow()

    # ✅ Actualizar el dueño actual en la tabla `carros`
    carro.id_cliente_actual = data.id_cliente

    # ✅ Insertar nuevo historial
    nuevo_historial = HistorialDueno(
        matricula_carro=data.matricula_carro,
        id_cliente=data.id_cliente,
        fecha_inicio=datetime.utcnow(),
        fecha_fin=None
    )
    db.add(nuevo_historial)

    db.commit()
    db.refresh(nuevo_historial)
    return {"message": "Dueño actualizado correctamente", "historial": nuevo_historial}