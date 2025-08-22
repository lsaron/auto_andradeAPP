from pydantic import BaseModel
from typing import List, Optional
from datetime import date

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
    aplica_iva: Optional[bool] = True
    detalle_gastos: List[DetalleGastoSchema]

    class Config:
        from_attributes = True
