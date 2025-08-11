from app.models import Cliente, Carro, Trabajo
from app.models.database import SessionLocal

def registrar_cliente(cedula, nombre, apellido, telefono, direccion, email):
    db = SessionLocal()
    nuevo_cliente = Cliente(
        cedula=cedula, nombre=nombre, apellido=apellido,
        telefono=telefono, direccion=direccion, email=email
    )
    db.add(nuevo_cliente)
    db.commit()
    db.close()
    return nuevo_cliente

def registrar_carro(matricula, marca, modelo, año, id_cliente):
    db = SessionLocal()
    nuevo_carro = Carro(
        id_carro=matricula, marca=marca, modelo=modelo, año=año, id_cliente=id_cliente
    )
    db.add(nuevo_carro)
    db.commit()
    db.close()
    return nuevo_carro