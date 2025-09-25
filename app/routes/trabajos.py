from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.trabajos import Trabajo
from app.models.detalle_gastos import DetalleGasto
from app.models.carros import Carro  # ✅ Importar el modelo de Carro
from app.models.comisiones_mecanicos import ComisionMecanico
from app.models.mecanicos import Mecanico
from app.schemas.trabajos import TrabajoSchema
from app.models.clientes import Cliente  
from weasyprint import HTML
from app.services.facturacion import generar_html_factura
from decimal import Decimal
from datetime import datetime, timezone

router = APIRouter(prefix="/trabajos", tags=["Trabajos"])


def calcular_quincena(fecha: datetime) -> str:
    """Calcula la quincena de una fecha dada (Q1: 1-15, Q2: 16-31)"""
    if fecha.day <= 15:
        return f"{fecha.year}-Q1"
    else:
        return f"{fecha.year}-Q2"


def obtener_fechas_quincena(quincena: str) -> tuple[datetime, datetime]:
    """Obtiene las fechas de inicio y fin de una quincena"""
    year, quarter = quincena.split('-')
    year = int(year)
    
    if quarter == 'Q1':
        return datetime(year, 1, 1, tzinfo=timezone.utc), datetime(year, 1, 15, 23, 59, 59, tzinfo=timezone.utc)
    else:
        return datetime(year, 1, 16, tzinfo=timezone.utc), datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)


def calcular_ganancia_neta(mano_obra: float, markup_repuestos: float, gastos_reales: float) -> Decimal:
    """
    Calcula la ganancia neta del trabajo
    Ganancia neta = Mano de obra + Markup repuestos - Gastos reales
    """
    mano_obra_decimal = Decimal(str(mano_obra or 0))
    markup_decimal = Decimal(str(markup_repuestos or 0))
    gastos_decimal = Decimal(str(gastos_reales or 0))
    
    ganancia_neta = mano_obra_decimal + markup_decimal - gastos_decimal
    return max(ganancia_neta, Decimal('0.00'))  # No permitir ganancias negativas


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
        # Ganancia total del trabajo (costo - gastos) - solo para información general
        ganancia_total = costo - total_gastos
        
        # Ganancia base para comisiones (mano de obra - gastos reales)
        mano_obra = trabajo.mano_obra if isinstance(trabajo.mano_obra, Decimal) else Decimal(str(trabajo.mano_obra or '0.00'))
        ganancia_base_comisiones = mano_obra - total_gastos

        # ✅ OBTENER MECÁNICOS ASIGNADOS AL TRABAJO
        mecanicos_asignados = db.query(ComisionMecanico).filter(
            ComisionMecanico.id_trabajo == trabajo.id
        ).all()
        
        # Lista de IDs de mecánicos asignados
        mecanicos_ids = [m.id_mecanico for m in mecanicos_asignados]
        
        # Obtener nombres de los mecánicos asignados
        nombres_mecanicos = []
        for mecanico_id in mecanicos_ids:
            mecanico = db.query(Mecanico).filter(Mecanico.id == mecanico_id).first()
            if mecanico:
                nombres_mecanicos.append(mecanico.nombre)

        resultado.append({
            "id": trabajo.id,
            "matricula_carro": trabajo.matricula_carro,
            "descripcion": trabajo.descripcion,
            "fecha": trabajo.fecha.strftime("%Y-%m-%d"),
            "fecha_registro": trabajo.fecha_registro.strftime("%Y-%m-%d") if trabajo.fecha_registro else trabajo.fecha.strftime("%Y-%m-%d"),
            "costo": float(costo),
            "mano_obra": float(trabajo.mano_obra or 0.0),
            "markup_repuestos": float(trabajo.markup_repuestos or 0.0),
            "ganancia": float(trabajo.ganancia or 0.0),
            "aplica_iva": trabajo.aplica_iva,
            "cliente_nombre": f"{cliente.nombre} {cliente.apellido}".strip() if cliente else "Sin cliente",
            "cliente_id": cliente.id_nacional if cliente else None,
            "total_gastos": float(total_gastos),
            "ganancia_total": float(ganancia_total),  # Ganancia total del trabajo
            "ganancia_base_comisiones": float(ganancia_base_comisiones),  # Ganancia base para comisiones
            # ✅ NUEVOS CAMPOS PARA MECÁNICOS
            "mecanicos_ids": mecanicos_ids,  # Lista de IDs de mecánicos asignados
            "mecanicos_nombres": nombres_mecanicos,  # Lista de nombres de mecánicos
            "total_mecanicos": len(mecanicos_ids),  # Número total de mecánicos asignados
        })

    return resultado


# CREAR UN NUEVO TRABAJO CON GASTOS
@router.post("/")
def crear_trabajo(trabajo: TrabajoSchema, db: Session = Depends(get_db)):
    carro_existente = db.query(Carro).filter(Carro.matricula == trabajo.matricula_carro).first()
    if not carro_existente:
        raise HTTPException(status_code=400, detail="El carro especificado no existe")

    # Calcular gastos reales totales
    total_gastos_reales = sum(gasto.monto for gasto in trabajo.detalle_gastos)
    
    # Calcular ganancia neta
    ganancia_neta = calcular_ganancia_neta(
        trabajo.mano_obra or 0.0,
        trabajo.markup_repuestos or 0.0,
        total_gastos_reales
    )

    nuevo_trabajo = Trabajo(
        matricula_carro=trabajo.matricula_carro,
        descripcion=trabajo.descripcion,
        fecha=trabajo.fecha,
        fecha_registro=trabajo.fecha_registro if trabajo.fecha_registro else trabajo.fecha,
        costo=trabajo.costo,
        mano_obra=trabajo.mano_obra or 0.0,
        markup_repuestos=trabajo.markup_repuestos or 0.0,
        ganancia=ganancia_neta,
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
        "id": nuevo_trabajo.id,
        "ganancia_calculada": float(ganancia_neta)
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
        "fecha_registro": trabajo.fecha_registro.strftime("%Y-%m-%d") if trabajo.fecha_registro else trabajo.fecha.strftime("%Y-%m-%d"),
        "costo": trabajo.costo,
        "mano_obra": float(trabajo.mano_obra or 0.0),
        "markup_repuestos": float(trabajo.markup_repuestos or 0.0),
        "ganancia": float(trabajo.ganancia or 0.0),
        "aplica_iva": trabajo.aplica_iva,
        "cliente_nombre": f"{cliente.nombre} {cliente.apellido}".strip() if cliente else "Sin cliente",
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
    
    # Calcular gastos reales totales
    total_gastos_reales = sum(gasto.monto for gasto in trabajo.detalle_gastos)
    
    # Calcular ganancia neta
    ganancia_neta = calcular_ganancia_neta(
        trabajo.mano_obra or 0.0,
        trabajo.markup_repuestos or 0.0,
        total_gastos_reales
    )
    
    # Actualizar datos del trabajo
    trabajo_db.descripcion = trabajo.descripcion
    trabajo_db.costo = trabajo.costo
    trabajo_db.mano_obra = trabajo.mano_obra or 0.0
    trabajo_db.markup_repuestos = trabajo.markup_repuestos or 0.0
    trabajo_db.ganancia = ganancia_neta
    trabajo_db.aplica_iva = trabajo.aplica_iva
    # Actualizar fecha a la fecha actual (última modificación)
    trabajo_db.fecha = datetime.utcnow()
    
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
    return {
        "message": "Trabajo actualizado correctamente",
        "ganancia_calculada": float(ganancia_neta)
    }


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


# RECALCULAR GANANCIAS DE TODOS LOS TRABAJOS (útil para migración)
@router.post("/recalcular-ganancias")
def recalcular_ganancias_todos_trabajos(db: Session = Depends(get_db)):
    """
    Recalcula las ganancias de todos los trabajos existentes
    Útil después de agregar el campo ganancia a la base de datos
    """
    try:
        trabajos = db.query(Trabajo).all()
        trabajos_actualizados = 0
        
        for trabajo in trabajos:
            # Obtener gastos reales del trabajo
            gastos = db.query(DetalleGasto).filter(DetalleGasto.id_trabajo == trabajo.id).all()
            total_gastos_reales = sum(
                (g.monto if isinstance(g.monto, Decimal) else Decimal(str(g.monto)))
                for g in gastos
            )
            
            # Calcular ganancia neta
            ganancia_neta = calcular_ganancia_neta(
                float(trabajo.mano_obra or 0.0),
                float(trabajo.markup_repuestos or 0.0),
                float(total_gastos_reales)
            )
            
            # Actualizar solo si la ganancia cambió
            if trabajo.ganancia != ganancia_neta:
                trabajo.ganancia = ganancia_neta
                trabajos_actualizados += 1
        
        db.commit()
        
        return {
            "message": f"Ganancias recalculadas exitosamente",
            "total_trabajos": len(trabajos),
            "trabajos_actualizados": trabajos_actualizados
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al recalcular ganancias: {str(e)}")


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
            "markup_repuestos": float(trabajo.markup_repuestos or 0.0),
            "ganancia": float(trabajo.ganancia or 0.0)
        }
    }


# ========================================
# RUTAS PARA ESTADOS DE COMISIONES
# ========================================

# GENERAR ESTADOS DE COMISIONES PARA UNA QUINCENA
@router.post("/comisiones/generar-quincena/{quincena}")
def generar_estados_comisiones_quincena(quincena: str, db: Session = Depends(get_db)):
    """
    Genera automáticamente los estados de comisiones para una quincena específica
    Formato de quincena: YYYY-Q1 o YYYY-Q2
    """
    try:
        # Validar formato de quincena
        if not (quincena.count('-') == 1 and quincena.endswith(('Q1', 'Q2'))):
            raise HTTPException(status_code=400, detail="Formato de quincena inválido. Use: YYYY-Q1 o YYYY-Q2")
        
        # Obtener fechas de la quincena
        fecha_inicio, fecha_fin = obtener_fechas_quincena(quincena)
        
        # Obtener todas las comisiones del mes que no tengan quincena asignada
        from app.models.comisiones_mecanicos import ComisionMecanico, EstadoComision
        
        comisiones_sin_quincena = db.query(ComisionMecanico).filter(
            ComisionMecanico.quincena.is_(None),
            ComisionMecanico.fecha_calculo >= fecha_inicio,
            ComisionMecanico.fecha_calculo <= fecha_fin
        ).all()
        
        comisiones_actualizadas = 0
        
        for comision in comisiones_sin_quincena:
            # Calcular quincena basándose en fecha_calculo
            quincena_comision = calcular_quincena(comision.fecha_calculo)
            
            # Solo actualizar si coincide con la quincena solicitada
            if quincena_comision == quincena:
                comision.quincena = quincena
                comision.estado_comision = EstadoComision.PENDIENTE
                comisiones_actualizadas += 1
        
        db.commit()
        
        return {
            "message": f"Estados de comisiones generados para quincena {quincena}",
            "quincena": quincena,
            "fecha_inicio": fecha_inicio.strftime("%Y-%m-%d"),
            "fecha_fin": fecha_fin.strftime("%Y-%m-%d"),
            "comisiones_actualizadas": comisiones_actualizadas
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al generar estados de comisiones: {str(e)}")


# OBTENER COMISIONES POR QUINCENA
@router.get("/comisiones/quincena/{quincena}")
def obtener_comisiones_quincena(quincena: str, db: Session = Depends(get_db)):
    """
    Obtiene todas las comisiones de una quincena específica con información detallada
    """
    try:
        from app.models.comisiones_mecanicos import ComisionMecanico
        from app.models.mecanicos import Mecanico
        
        # Obtener comisiones de la quincena con información del mecánico y trabajo
        comisiones = db.query(
            ComisionMecanico,
            Mecanico.nombre.label('nombre_mecanico'),
            Trabajo.descripcion.label('descripcion_trabajo')
        ).join(
            Mecanico, ComisionMecanico.id_mecanico == Mecanico.id
        ).join(
            Trabajo, ComisionMecanico.id_trabajo == Trabajo.id
        ).filter(
            ComisionMecanico.quincena == quincena
        ).all()
        
        resultado = []
        for comision, nombre_mecanico, descripcion_trabajo in comisiones:
            resultado.append({
                "id": comision.id,
                "id_trabajo": comision.id_trabajo,
                "id_mecanico": comision.id_mecanico,
                "nombre_mecanico": nombre_mecanico,
                "descripcion_trabajo": descripcion_trabajo,
                "monto_comision": float(comision.monto_comision),
                "estado_comision": comision.estado_comision.value,
                "quincena": comision.quincena,
                "fecha_calculo": comision.fecha_calculo.strftime("%Y-%m-%d %H:%M:%S")
            })
        
        return {
            "quincena": quincena,
            "total_comisiones": len(resultado),
            "comisiones": resultado
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener comisiones: {str(e)}")


# CAMBIAR ESTADO DE UNA COMISIÓN
@router.put("/comisiones/{id_comision}/estado")
def cambiar_estado_comision(
    id_comision: int, 
    estado_update: dict,  # {"estado": "APROBADA" o "PENALIZADA"}
    db: Session = Depends(get_db)
):
    """
    Cambia el estado de una comisión específica
    """
    try:
        from app.models.comisiones_mecanicos import ComisionMecanico, EstadoComision
        
        comision = db.query(ComisionMecanico).filter(
            ComisionMecanico.id == id_comision
        ).first()
        
        if not comision:
            raise HTTPException(status_code=404, detail="Comisión no encontrada")
        
        nuevo_estado = estado_update.get("estado")
        if nuevo_estado not in ["APROBADA", "PENALIZADA", "DENEGADA"]:
            raise HTTPException(status_code=400, detail="Estado inválido. Use: APROBADA, PENALIZADA o DENEGADA")
        
        comision.estado_comision = EstadoComision(nuevo_estado)
        db.commit()
        
        return {
            "message": f"Estado de comisión cambiado a {nuevo_estado}",
            "id_comision": id_comision,
            "nuevo_estado": nuevo_estado
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al cambiar estado: {str(e)}")


# OBTENER REPORTE FINANCIERO DE COMISIONES POR QUINCENA
@router.get("/comisiones/reporte-financiero/{quincena}")
def obtener_reporte_financiero_comisiones(quincena: str, db: Session = Depends(get_db)):
    """
    Obtiene el reporte financiero de comisiones para una quincena específica
    Solo incluye comisiones APROBADAS para gastos
    """
    try:
        from app.models.comisiones_mecanicos import ComisionMecanico, EstadoComision
        
        # Obtener comisiones aprobadas (gastos reales)
        comisiones_aprobadas = db.query(ComisionMecanico).filter(
            ComisionMecanico.quincena == quincena,
            ComisionMecanico.estado_comision == EstadoComision.APROBADA
        ).all()
        
        # Obtener comisiones penalizadas (ahorro)
        comisiones_penalizadas = db.query(ComisionMecanico).filter(
            ComisionMecanico.quincena == quincena,
            ComisionMecanico.estado_comision == EstadoComision.PENALIZADA
        ).all()
        
        # Obtener comisiones pendientes
        comisiones_pendientes = db.query(ComisionMecanico).filter(
            ComisionMecanico.quincena == quincena,
            ComisionMecanico.estado_comision == EstadoComision.PENDIENTE
        ).all()
        
        # Obtener comisiones denegadas
        comisiones_denegadas = db.query(ComisionMecanico).filter(
            ComisionMecanico.quincena == quincena,
            ComisionMecanico.estado_comision == EstadoComision.DENEGADA
        ).all()
        
        total_gastos_comisiones = sum(float(c.monto_comision) for c in comisiones_aprobadas)
        total_ahorro_penalizaciones = sum(float(c.monto_comision) for c in comisiones_penalizadas)
        total_pendiente = sum(float(c.monto_comision) for c in comisiones_pendientes)
        total_denegadas = sum(float(c.monto_comision) for c in comisiones_denegadas)  # Siempre será 0
        
        return {
            "quincena": quincena,
            "resumen": {
                "total_comisiones_aprobadas": len(comisiones_aprobadas),
                "total_gastos_comisiones": total_gastos_comisiones,
                "total_comisiones_penalizadas": len(comisiones_penalizadas),
                "total_ahorro_penalizaciones": total_ahorro_penalizaciones,
                "total_comisiones_pendientes": len(comisiones_pendientes),
                "total_pendiente": total_pendiente,
                "total_comisiones_denegadas": len(comisiones_denegadas),
                "total_denegadas": total_denegadas
            },
            "comisiones_aprobadas": [
                {
                    "id": c.id,
                    "id_mecanico": c.id_mecanico,
                    "monto_comision": float(c.monto_comision)
                } for c in comisiones_aprobadas
            ],
            "comisiones_penalizadas": [
                {
                    "id": c.id,
                    "id_mecanico": c.id_mecanico,
                    "monto_comision": float(c.monto_comision)
                } for c in comisiones_penalizadas
            ],
            "comisiones_denegadas": [
                {
                    "id": c.id,
                    "id_mecanico": c.id_mecanico,
                    "monto_comision": float(c.monto_comision)
                } for c in comisiones_denegadas
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener reporte financiero: {str(e)}")