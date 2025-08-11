from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.clientes import Cliente
from app.models.carros import Carro
from app.schemas.clientes import ClienteSchema

router = APIRouter()

# Obtener todos los clientes
@router.get("/clientes/")
def obtener_clientes(db: Session = Depends(get_db)):
    clientes = db.query(Cliente).all()
    return [
        {
            "id_nacional": cliente.id_nacional,
            "nombre": cliente.nombre,
            "correo": cliente.correo,
            "telefono": cliente.telefono
        }
        for cliente in clientes
    ]

# Obtener un cliente con sus carros
@router.get("/clientes/{id_nacional}")
def obtener_cliente_con_carros(id_nacional: str, db: Session = Depends(get_db)):
    # Buscar el cliente por ID Nacional
    cliente = db.query(Cliente).filter(Cliente.id_nacional == id_nacional).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Obtener todos los carros asociados al cliente
    carros = db.query(Carro).filter(Carro.id_cliente_actual == id_nacional).all()
    lista_carros = [
        {
            "matricula": carro.matricula,
            "marca": carro.marca,
            "modelo": carro.modelo,
            "anio": carro.anio
        }
        for carro in carros
    ]

    return {
        "id_nacional": cliente.id_nacional,
        "nombre": cliente.nombre,
        "correo": cliente.correo,
        "telefono": cliente.telefono,
        "carros": lista_carros
    }


# Crear un cliente
@router.post("/clientes/")
def crear_cliente(cliente: ClienteSchema, db: Session = Depends(get_db)):
    nuevo_cliente = Cliente(
        id_nacional=cliente.id_nacional,  # 👈 Aseguramos que se envíe el ID Nacional
        nombre=cliente.nombre,
        correo=cliente.correo,
        telefono=cliente.telefono
    )
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente

# Actualizar un cliente
@router.put("/clientes/{id_nacional}")
def actualizar_cliente(id_nacional: str, cliente: ClienteSchema, db: Session = Depends(get_db)):
    cliente_db = db.query(Cliente).filter(Cliente.id_nacional == id_nacional).first()
    if not cliente_db:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente_db.nombre = cliente.nombre
    cliente_db.correo = cliente.correo
    cliente_db.telefono = cliente.telefono

    db.commit()
    return cliente_db

# Eliminar un cliente
@router.delete("/clientes/{id_nacional}")
def eliminar_cliente(id_nacional: str, db: Session = Depends(get_db)):
    cliente_db = db.query(Cliente).filter(Cliente.id_nacional == id_nacional).first()
    if not cliente_db:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db.delete(cliente_db)
    db.commit()
    return {"message": "Cliente eliminado correctamente"}
