from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from enum import Enum

class EstadoComision(str, Enum):
    PENDIENTE = "PENDIENTE"
    APROBADA = "APROBADA"
    PENALIZADA = "PENALIZADA"

class DetalleGastoSchema(BaseModel):
    descripcion: str
    monto: float  # Costo real del repuesto
    monto_cobrado: Optional[float] = None  # Precio cobrado al cliente (opcional)

class TrabajoSchema(BaseModel):
    matricula_carro: str
    descripcion: str
    fecha: date
    costo: float
    mano_obra: Optional[float] = 0.0  # Monto de mano de obra del trabajo
    markup_repuestos: Optional[float] = 0.0  # Markup aplicado a los repuestos
    ganancia: Optional[float] = 0.0  # Ganancia neta del trabajo
    aplica_iva: Optional[bool] = True
    detalle_gastos: List[DetalleGastoSchema]

    class Config:
        from_attributes = True

class EstadoComisionUpdate(BaseModel):
    estado: EstadoComision

class ComisionQuincenaSchema(BaseModel):
    id: int
    id_trabajo: int
    id_mecanico: int
    nombre_mecanico: str
    descripcion_trabajo: str
    monto_comision: float
    estado_comision: EstadoComision
    quincena: str
    fecha_calculo: str

    class Config:
        from_attributes = True
