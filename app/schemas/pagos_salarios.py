from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class PagoSalarioBase(BaseModel):
    id_mecanico: int = Field(..., description="ID del mecánico")
    monto_salario: Decimal = Field(..., gt=0, description="Monto del salario")
    semana_pago: str = Field(..., pattern="^[1-4]$", description="Semana de pago (1, 2, 3 o 4)")
    fecha_pago: date = Field(..., description="Fecha del pago")

class PagoSalarioCreate(PagoSalarioBase):
    pass

class PagoSalarioUpdate(BaseModel):
    monto_salario: Optional[Decimal] = Field(None, gt=0)
    semana_pago: Optional[str] = Field(None, pattern="^[1-4]$")
    fecha_pago: Optional[date] = None

class PagoSalario(PagoSalarioBase):
    id: int
    created_at: datetime
    nombre_mecanico: Optional[str] = None

    class Config:
        from_attributes = True
