from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.trabajos import Trabajo
from app.models.detalle_gastos import DetalleGasto
from app.models.carros import Carro  # ✅ Importar el modelo de Carro
from app.schemas.trabajos import TrabajoSchema
from app.models.clientes import Cliente  
from weasyprint import HTML
from app.services.facturacion import generar_html_factura
from decimal import Decimal

router = APIRouter(prefix="/trabajos", tags=["Trabajos"])


# OBTENER TODOS LOS TRABAJOS
@router.get("/")
def obtener_todos_los_trabajos(db: Session = Depends(get_db)):
    trabajos = db.query(Trabajo).all()
    resultado = []

    for trabajo in trabajos:
        carro = db.query(Carro).filter(Carro.matricula == trabajo.matricula_carro).first()

        cliente = None
        if carro:
            cliente = db.query(Cliente).filter(Cliente.id_nacional == carro.id_cliente_actual).first()

        # Gastos como Decimal
        gastos = db.query(DetalleGasto).filter(DetalleGasto.id_trabajo == trabajo.id).all()
        total_gastos = sum(
            (g.monto if isinstance(g.monto, Decimal) else Decimal(str(g.monto)))
            for g in gastos
        )

        # Costo como Decimal
        costo = trabajo.costo if isinstance(trabajo.costo, Decimal) else Decimal(str(trabajo.costo))
        ganancia = costo - total_gastos

        resultado.append({
            "id": trabajo.id,
            "matricula_carro": trabajo.matricula_carro,
            "descripcion": trabajo.descripcion,
            "fecha": trabajo.fecha.strftime("%Y-%m-%d"),
            "costo": float(costo),
            "mano_obra": float(trabajo.mano_obra or 0.0),
            "markup_repuestos": float(trabajo.markup_repuestos or 0.0),
            "aplica_iva": trabajo.aplica_iva,
            "cliente_nombre": cliente.nombre if cliente else "Sin cliente",
            "cliente_id": cliente.id_nacional if cliente else None,
            "total_gastos": float(total_gastos),
            "ganancia": float(ganancia),
        })

    return resultado


# CREAR UN NUEVO TRABAJO CON GASTOS
@router.post("/")
def crear_trabajo(trabajo: TrabajoSchema, db: Session = Depends(get_db)):
    carro_existente = db.query(Carro).filter(Carro.matricula == trabajo.matricula_carro).first()
    if not carro_existente:
        raise HTTPException(status_code=400, detail="El carro especificado no existe")

    nuevo_trabajo = Trabajo(
        matricula_carro=trabajo.matricula_carro,
        descripcion=trabajo.descripcion,
        fecha=trabajo.fecha,
        costo=trabajo.costo,
        mano_obra=trabajo.mano_obra or 0.0,
        markup_repuestos=trabajo.markup_repuestos or 0.0,
        aplica_iva=trabajo.aplica_iva
    )
    db.add(nuevo_trabajo)
    db.commit()
    db.refresh(nuevo_trabajo)

    for gasto in trabajo.detalle_gastos:
        nuevo_gasto = DetalleGasto(
            id_trabajo=nuevo_trabajo.id,
            descripcion=gasto.descripcion,
            monto=gasto.monto,
            monto_cobrado=gasto.monto_cobrado if gasto.monto_cobrado else gasto.monto
        )
        db.add(nuevo_gasto)

    db.commit()
    return {
        "message": "Trabajo creado con sus gastos correctamente",
        "id": nuevo_trabajo.id
    }


# OBTENER UN TRABAJO ESPECÍFICO CON SUS GASTOS
@router.get("/trabajo/{id}")
def obtener_trabajo(id: int, db: Session = Depends(get_db)):
    trabajo = db.query(Trabajo).filter(Trabajo.id == id).first()
    if not trabajo:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    # Obtener información del carro
    carro = db.query(Carro).filter(Carro.matricula == trabajo.matricula_carro).first()
    
    # Obtener información del cliente
    cliente = None
    if carro:
        cliente = db.query(Cliente).filter(Cliente.id_nacional == carro.id_cliente_actual).first()
    
    # Obtener gastos del trabajo
    gastos = db.query(DetalleGasto).filter(DetalleGasto.id_trabajo == trabajo.id).all()
    
    return {
        "id": trabajo.id,
        "matricula_carro": trabajo.matricula_carro,
        "descripcion": trabajo.descripcion,
        "fecha": trabajo.fecha.strftime("%Y-%m-%d"),
        "costo": trabajo.costo,
        "mano_obra": float(trabajo.mano_obra or 0.0),
        "markup_repuestos": float(trabajo.markup_repuestos or 0.0),
        "aplica_iva": trabajo.aplica_iva,
        "cliente_nombre": cliente.nombre if cliente else "Sin cliente",
        "cliente_id": cliente.id_nacional if cliente else None,
        "gastos": [
            {
                "id": gasto.id,
                "descripcion": gasto.descripcion,
                "monto": gasto.monto,
                "monto_cobrado": gasto.monto_cobrado
            }
            for gasto in gastos
        ]
    }


# ACTUALIZAR UN TRABAJO
@router.put("/trabajo/{id}")
def actualizar_trabajo(id: int, trabajo: TrabajoSchema, db: Session = Depends(get_db)):
    trabajo_db = db.query(Trabajo).filter(Trabajo.id == id).first()
    if not trabajo_db:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    # Actualizar datos del trabajo
    trabajo_db.descripcion = trabajo.descripcion
    trabajo_db.costo = trabajo.costo
    trabajo_db.mano_obra = trabajo.mano_obra or 0.0
    trabajo_db.markup_repuestos = trabajo.markup_repuestos or 0.0
    trabajo_db.aplica_iva = trabajo.aplica_iva
    
    # Eliminar gastos existentes
    db.query(DetalleGasto).filter(DetalleGasto.id_trabajo == id).delete()
    
    # Agregar nuevos gastos
    for gasto in trabajo.detalle_gastos:
        nuevo_gasto = DetalleGasto(
            id_trabajo=id,
            descripcion=gasto.descripcion,
            monto=gasto.monto,
            monto_cobrado=gasto.monto_cobrado if gasto.monto_cobrado else gasto.monto
        )
        db.add(nuevo_gasto)
    
    db.commit()
    return {"message": "Trabajo actualizado correctamente"}


# ELIMINAR UN TRABAJO
@router.delete("/trabajo/{id}")
def eliminar_trabajo(id: int, db: Session = Depends(get_db)):
    trabajo_db = db.query(Trabajo).filter(Trabajo.id == id).first()
    if not trabajo_db:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    # Los gastos se eliminan automáticamente por CASCADE
    db.delete(trabajo_db)
    db.commit()
    return {"message": "Trabajo eliminado correctamente"}


@router.get("/{id}/factura", response_class=Response)
def generar_factura_pdf(id: int, aplicar_iva: bool = True, db: Session = Depends(get_db)):
    # Buscar el trabajo
    trabajo = db.query(Trabajo).filter(Trabajo.id == id).first()
    if not trabajo:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")

    # Buscar carro y cliente relacionados
    carro = db.query(Carro).filter(Carro.matricula == trabajo.matricula_carro).first()
    cliente = db.query(Cliente).filter(Cliente.id_nacional == carro.id_cliente_actual).first()

    # Buscar los gastos asociados
    gastos = db.query(DetalleGasto).filter(DetalleGasto.id_trabajo == trabajo.id).all()

    # Calcular totales
    iva = round(trabajo.costo * Decimal("0.13"), 2) if aplicar_iva else Decimal("0.00")
    total = trabajo.costo + iva

    # Armar estructura para plantilla
    datos = {
        "cliente": {
            "nombre": cliente.nombre,
            "id_nacional": cliente.id_nacional
        },
        "carro": {
            "marca": carro.marca,
            "modelo": carro.modelo,
            "matricula": carro.matricula
        },
        "trabajo": {
            "descripcion": trabajo.descripcion,
            "fecha": trabajo.fecha.strftime("%Y-%m-%d"),
            "costo": float(trabajo.costo),
            "detalle_gastos": [{"descripcion": g.descripcion, "monto": float(g.monto), "monto_cobrado": float(g.monto_cobrado) if g.monto_cobrado else float(g.monto)} for g in gastos]
        },
        "iva": float(iva),
        "total": float(total)
    }

    # Generar HTML y convertirlo a PDF
    html = generar_html_factura(datos)
    pdf = HTML(string=html).write_pdf()

    return Response(content=pdf, media_type="application/pdf", headers={
        "Content-Disposition": f"inline; filename=factura_trabajo_{id}.pdf"
    })


# OBTENER SOLO LOS GASTOS DE UN TRABAJO
@router.get("/trabajo/{id}/gastos")
def obtener_gastos_trabajo(id: int, db: Session = Depends(get_db)):
    """Obtener solo los gastos detallados de un trabajo específico"""
    trabajo = db.query(Trabajo).filter(Trabajo.id == id).first()
    if not trabajo:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    # Obtener todos los gastos del trabajo
    gastos = db.query(DetalleGasto).filter(DetalleGasto.id_trabajo == id).all()
    
    resultado = []
    for gasto in gastos:
        resultado.append({
            "id": gasto.id,
            "descripcion": gasto.descripcion,
            "monto": float(gasto.monto),
            "monto_cobrado": float(gasto.monto_cobrado) if gasto.monto_cobrado else float(gasto.monto)
        })
    
    # Devolver tanto los gastos como la información del trabajo
    return {
        "gastos": resultado,
        "trabajo": {
            "id": trabajo.id,
            "costo": float(trabajo.costo or 0.0),
            "mano_obra": float(trabajo.mano_obra or 0.0),
            "markup_repuestos": float(trabajo.markup_repuestos or 0.0)
        }
    }