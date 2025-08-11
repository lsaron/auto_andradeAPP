from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class DetalleGastoSchema(BaseModel):
    descripcion: str
    monto: float

class TrabajoSchema(BaseModel):
    matricula_carro: str
    descripcion: str
    fecha: date
    costo: float
    aplica_iva: Optional[bool] = True
    detalle_gastos: List[DetalleGastoSchema]

    class Config:
        from_attributes = True
