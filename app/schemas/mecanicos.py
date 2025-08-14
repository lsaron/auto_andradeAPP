from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime
from decimal import Decimal

# Schema base para Mecánico
class MecanicoBase(BaseModel):
    id_nacional: str = Field(..., min_length=1, max_length=20, description="Número de identificación nacional")
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre completo del mecánico")
    correo: Optional[str] = Field(None, max_length=100, description="Correo electrónico")
    telefono: Optional[str] = Field(None, max_length=20, description="Número de teléfono")
    porcentaje_comision: Decimal = Field(default=2.00, ge=0, le=100, description="Porcentaje de comisión (2% fijo)")

# Schema para crear un nuevo mecánico
class MecanicoCreate(MecanicoBase):
    pass

# Schema para actualizar un mecánico
class MecanicoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    correo: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    porcentaje_comision: Optional[Decimal] = Field(None, ge=0, le=100)
    activo: Optional[bool] = None

# Schema para respuesta de mecánico
class Mecanico(MecanicoBase):
    id: int
    fecha_contratacion: datetime
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Schema para mecánico con estadísticas
class MecanicoConEstadisticas(Mecanico):
    trabajos_completados: int = 0
    total_ganancias: Decimal = Decimal('0.00')
    total_comisiones: Decimal = Decimal('0.00')

# Schema para asignación de mecánico a trabajo
class AsignacionMecanico(BaseModel):
    id_mecanico: int = Field(..., description="ID del mecánico a asignar")
    porcentaje_comision: Optional[Union[int, float]] = Field(None, description="Porcentaje de comisión personalizado")

# Schema para respuesta de asignación
class AsignacionMecanicoResponse(BaseModel):
    id_trabajo: int
    id_mecanico: int
    nombre_mecanico: str
    porcentaje_comision: Decimal
    monto_comision: Decimal
    ganancia_trabajo: Decimal

    class Config:
        orm_mode = True
