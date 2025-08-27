from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

class GastoTallerBase(BaseModel):
    descripcion: str = Field(..., min_length=1, description="Descripción del gasto")
    monto: Decimal = Field(..., gt=0, description="Monto del gasto")
    categoria: str = Field(..., min_length=1, description="Categoría del gasto")
    fecha_gasto: datetime = Field(..., description="Fecha del gasto")

class GastoTallerCreate(GastoTallerBase):
    pass

class GastoTallerUpdate(BaseModel):
    descripcion: Optional[str] = Field(None, min_length=1)
    monto: Optional[Decimal] = Field(None, gt=0)
    categoria: Optional[str] = Field(None, min_length=1)
    fecha_gasto: Optional[datetime] = None

class GastoTaller(GastoTallerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
