from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.carros import Carro
from app.models.historial_duenos import HistorialDueno
from app.models.clientes import Cliente
from app.models.trabajos import Trabajo
from app.models.detalle_gastos import DetalleGasto
from app.schemas.carros import CarroSchema
router = APIRouter()


#Obtener todos los carros
@router.get("/carros/")
def obtener_todos_los_carros(db: Session = Depends(get_db)):
    carros = db.query(Carro).all()

    resultado = []
    for carro in carros:
        cliente = db.query(Cliente).filter(Cliente.id_nacional == carro.id_cliente_actual).first()
        resultado.append({
            "matricula": carro.matricula,
            "marca": carro.marca,
            "modelo": carro.modelo,
            "anio": carro.anio,
            "id_cliente_actual": carro.id_cliente_actual,
            "nombre_cliente": cliente.nombre if cliente else "Sin propietario"
        })

    return resultado

#OBTENER HISTORIAL COMPLETO DE UN CARRO
@router.get("/carros/historial/{matricula}")
def obtener_historial_carro(matricula: str, db: Session = Depends(get_db)):
    carro = db.query(Carro).filter(Carro.matricula == matricula).first()
    if not carro:
        raise HTTPException(status_code=404, detail="Carro no encontrado")

    cliente_actual = db.query(Cliente).filter(Cliente.id_nacional == carro.id_cliente_actual).first()
    dueno_actual = {
        "id_cliente": cliente_actual.id_nacional if cliente_actual else None,
        "nombre": cliente_actual.nombre if cliente_actual else "Sin dueño"
    }

    historial_duenos = (
        db.query(HistorialDueno, Cliente.nombre)
        .outerjoin(Cliente, HistorialDueno.id_cliente == Cliente.id_nacional)
        .filter(HistorialDueno.matricula_carro == carro.matricula)
        .all()
    )

    lista_duenos = [
        {
            "id_cliente": d.HistorialDueno.id_cliente,
            "nombre": d.nombre if d.nombre else "Desconocido",
            "fecha_inicio": d.HistorialDueno.fecha_inicio,
            "fecha_fin": d.HistorialDueno.fecha_fin
        }
        for d in historial_duenos
    ]
    historial_trabajos = (
        db.query(Trabajo).filter(Trabajo.matricula_carro == carro.matricula).all()
    )

    lista_trabajos = []
    for t in historial_trabajos:
        gastos = [
            {
                "id": g.id,
                "descripcion": g.descripcion,
                "monto": g.monto
            }
            for g in t.detalle_gastos
        ]
        lista_trabajos.append({
            "id": t.id,
            "descripcion": t.descripcion,
            "fecha": t.fecha,
            "costo": t.costo,
            "gastos": gastos
        })


    return {
        "matricula": carro.matricula,
        "marca": carro.marca,
        "modelo": carro.modelo,
        "anio": carro.anio,
        "dueno_actual": dueno_actual,
        "historial_duenos": lista_duenos,
        "historial_trabajos": lista_trabajos
    }


# ✅ CREAR UN NUEVO CARRO
@router.post("/carros/")
def crear_carro(carro: CarroSchema, db: Session = Depends(get_db)):
    carro_existente = db.query(Carro).filter(Carro.matricula == carro.matricula).first()
    if carro_existente:
        raise HTTPException(status_code=400, detail="Ya existe un carro con esta matrícula")

    if carro.id_cliente_actual:
        cliente_existente = db.query(Cliente).filter(Cliente.id_nacional == carro.id_cliente_actual).first()
        if not cliente_existente:
            raise HTTPException(status_code=400, detail="El cliente especificado no existe")

    nuevo_carro = Carro(
        matricula=carro.matricula,
        marca=carro.marca,
        modelo=carro.modelo,
        anio=carro.anio,
        id_cliente_actual=carro.id_cliente_actual
    )
    db.add(nuevo_carro)

    if carro.id_cliente_actual:
        historial = HistorialDueno(
            matricula_carro=nuevo_carro.matricula,
            id_cliente=carro.id_cliente_actual,
            fecha_inicio=datetime.utcnow(),
            fecha_fin=None
        )
        db.add(historial)

    db.commit()
    db.refresh(nuevo_carro)
    return {"message": "Carro creado correctamente", "carro": nuevo_carro}


# ✅ ACTUALIZAR DUEÑO DE UN CARRO
@router.put("/carros/{matricula}")
def actualizar_info_carro(matricula: str, data: CarroSchema, db: Session = Depends(get_db)):
    carro_db = db.query(Carro).filter(Carro.matricula == matricula).first()
    if not carro_db:
        raise HTTPException(status_code=404, detail="Carro no encontrado")

    carro_db.marca = data.marca
    carro_db.modelo = data.modelo
    carro_db.anio = data.anio
    carro_db.id_cliente_actual = data.id_cliente_actual

    db.commit()
    db.refresh(carro_db)

    return {"message": "Información del carro actualizada correctamente"}


# ✅ ELIMINAR UN CARRO Y SU HISTORIAL
@router.delete("/carros/{matricula}")
def eliminar_carro(matricula: str, db: Session = Depends(get_db)):
    carro_db = db.query(Carro).filter(Carro.matricula == matricula).first()
    if not carro_db:
        raise HTTPException(status_code=404, detail="Carro no encontrado")

    trabajos = db.query(Trabajo).filter(Trabajo.matricula_carro == matricula).all()
    for trabajo in trabajos:
        db.query(DetalleGasto).filter(DetalleGasto.id_trabajo == trabajo.id).delete()
        db.delete(trabajo)

    db.delete(carro_db)
    db.commit()
    return {"message": "Carro eliminado correctamente"}
