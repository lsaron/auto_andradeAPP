from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import get_db
from app.models.trabajos import Trabajo
from app.models.detalle_gastos import DetalleGasto
from app.models.clientes import Cliente
from app.models.carros import Carro

router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"]
)

# 📅 Reporte mensual con ingresos, gastos y conteos
@router.get("/mensual/{mes}/{anio}")
def reporte_mensual(mes: int, anio: int, db: Session = Depends(get_db)):
    trabajos_mes = db.query(Trabajo).filter(
        func.extract('month', Trabajo.fecha) == mes,
        func.extract('year', Trabajo.fecha) == anio
    ).all()

    cantidad_trabajos = len(trabajos_mes)

    if not trabajos_mes:
        return {
            "mes": mes,
            "anio": anio,
            "ingresos_totales": 0,
            "gastos_totales": 0,
            "iva_calculado": 0,
            "ganancia_neta": 0,
            "cantidad_trabajos": 0,
            "total_clientes": db.query(func.count()).select_from(Cliente).scalar(),
            "total_carros": db.query(func.count()).select_from(Carro).scalar()
        }

    ingresos = sum(float(t.costo) for t in trabajos_mes)

    gastos = db.query(func.sum(DetalleGasto.monto))\
        .join(Trabajo)\
        .filter(
            func.extract('month', Trabajo.fecha) == mes,
            func.extract('year', Trabajo.fecha) == anio
        ).scalar() or 0
    gastos = float(gastos)

    iva = round(sum(float(t.costo) * 0.13 for t in trabajos_mes if t.aplica_iva), 2)
    ganancia_neta = round(ingresos - gastos - iva, 2)


    total_clientes = db.query(func.count()).select_from(Cliente).scalar()
    total_carros = db.query(func.count()).select_from(Carro).scalar()

    return {
        "mes": mes,
        "anio": anio,
        "ingresos_totales": ingresos,
        "gastos_totales": gastos,
        "iva_calculado": iva,
        "ganancia_neta": ganancia_neta,
        "cantidad_trabajos": cantidad_trabajos,
        "total_clientes": total_clientes,
        "total_carros": total_carros
    }

# 📊 Totales generales (dashboard)
@router.get("/totales")
def obtener_totales(db: Session = Depends(get_db)):
    total_clientes = db.query(func.count()).select_from(Cliente).scalar()
    total_carros = db.query(func.count()).select_from(Carro).scalar()
    total_trabajos = db.query(func.count()).select_from(Trabajo).scalar()

    return {
        "total_clientes": total_clientes,
        "total_carros": total_carros,
        "total_trabajos": total_trabajos
    }
