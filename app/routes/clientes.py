from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
from app.models.database import get_db
from app.models.clientes import Cliente
from app.models.carros import Carro
from app.models.trabajos import Trabajo
from app.models.historial_duenos import HistorialDueno
from app.schemas.clientes import ClienteSchema
from sqlalchemy import func, text

router = APIRouter()

# Obtener todos los clientes
@router.get("/clientes/")
def obtener_clientes(db: Session = Depends(get_db)):
    clientes = db.query(Cliente).all()
    resultado = []
    
    for cliente in clientes:
        # Obtener todos los carros del cliente
        carros = db.query(Carro).filter(Carro.id_cliente_actual == cliente.id_nacional).all()
        
        # Calcular el total gastado sumando todos los trabajos de los carros del cliente
        total_gastado = 0
        for carro in carros:
            trabajos = db.query(Trabajo).filter(Trabajo.matricula_carro == carro.matricula).all()
            for trabajo in trabajos:
                # Total cobrado al cliente = Gastos cobrados + Mano de obra
                gastos_cobrados = Decimal('0')
                if trabajo.detalle_gastos:
                    gastos_cobrados = sum(
                        Decimal(str(g.monto_cobrado or g.monto or 0)) 
                        for g in trabajo.detalle_gastos
                    )
                
                mano_obra = Decimal(str(trabajo.mano_obra or 0))
                total_trabajo = gastos_cobrados + mano_obra
                total_gastado += float(total_trabajo)
        
        resultado.append({
            "id_nacional": cliente.id_nacional,
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "correo": cliente.correo,
            "telefono": cliente.telefono,
            "total_gastado": total_gastado,
            "vehicle_count": len(carros),
            "registration_date": datetime.utcnow().isoformat()
        })
    
    return resultado

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
        "apellido": cliente.apellido,
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
        apellido=cliente.apellido,
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

    try:
        # Si la cédula cambió, verificar que no exista otro cliente con la nueva cédula
        if cliente.id_nacional != id_nacional:
            cliente_existente = db.query(Cliente).filter(Cliente.id_nacional == cliente.id_nacional).first()
            if cliente_existente:
                raise HTTPException(status_code=400, detail="Ya existe un cliente con esta cédula")
            
            # Deshabilitar temporalmente las restricciones de clave foránea
            db.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            
            # Actualizar las referencias en la tabla carros usando SQL raw
            db.execute(text("""
                UPDATE carros 
                SET id_cliente_actual = :nueva_cedula 
                WHERE id_cliente_actual = :cedula_original
            """), {"nueva_cedula": cliente.id_nacional, "cedula_original": id_nacional})
            
            # Actualizar las referencias en la tabla historial_duenos usando SQL raw
            db.execute(text("""
                UPDATE historial_duenos 
                SET id_cliente = :nueva_cedula 
                WHERE id_cliente = :cedula_original
            """), {"nueva_cedula": cliente.id_nacional, "cedula_original": id_nacional})
            
            # Actualizar la cédula del cliente usando SQL raw
            db.execute(text("""
                UPDATE clientes 
                SET id_nacional = :nueva_cedula,
                    nombre = :nombre,
                    apellido = :apellido,
                    correo = :correo,
                    telefono = :telefono
                WHERE id_nacional = :cedula_original
            """), {
                "nueva_cedula": cliente.id_nacional,
                "cedula_original": id_nacional,
                "nombre": cliente.nombre,
                "apellido": cliente.apellido,
                "correo": cliente.correo,
                "telefono": cliente.telefono
            })
            
            # Rehabilitar las restricciones de clave foránea
            db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            
        else:
            # Si la cédula no cambió, solo actualizar los otros campos
            db.execute(text("""
                UPDATE clientes 
                SET nombre = :nombre,
                    apellido = :apellido,
                    correo = :correo,
                    telefono = :telefono
                WHERE id_nacional = :cedula
            """), {
                "cedula": id_nacional,
                "nombre": cliente.nombre,
                "apellido": cliente.apellido,
                "correo": cliente.correo,
                "telefono": cliente.telefono
            })

        db.commit()
        
        # Obtener el cliente actualizado
        cliente_actualizado = db.query(Cliente).filter(Cliente.id_nacional == cliente.id_nacional).first()
        return cliente_actualizado
        
    except Exception as e:
        db.rollback()
        # Rehabilitar las restricciones de clave foránea en caso de error
        try:
            db.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Error al actualizar cliente: {str(e)}")

# Eliminar un cliente
@router.delete("/clientes/{id_nacional}")
def eliminar_cliente(id_nacional: str, db: Session = Depends(get_db)):
    cliente_db = db.query(Cliente).filter(Cliente.id_nacional == id_nacional).first()
    if not cliente_db:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db.delete(cliente_db)
    db.commit()
    return {"message": "Cliente eliminado correctamente"}
