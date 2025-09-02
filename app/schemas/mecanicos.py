from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime, date
from decimal import Decimal

# Schema base para Mecánico
class MecanicoBase(BaseModel):
    id_nacional: str = Field(..., min_length=1, max_length=20, description="ID nacional del mecánico")
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre completo del mecánico")
    telefono: Optional[str] = Field(None, max_length=20, description="Número de teléfono")
    fecha_contratacion: Optional[date] = Field(None, description="Fecha de contratación")
    porcentaje_comision: Optional[Decimal] = Field(None, description="Porcentaje de comisión")

# Schema para crear un nuevo mecánico
class MecanicoCreate(MecanicoBase):
    pass

# Schema para actualizar un mecánico
class MecanicoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    fecha_contratacion: Optional[date] = None

# Schema para respuesta de mecánico
class Mecanico(MecanicoBase):
    id: int
    activo: bool = True

    class Config:
        from_attributes = True

# Alias para compatibilidad
MecanicoSchema = Mecanico

# Schema para mecánico con estadísticas
class MecanicoConEstadisticas(Mecanico):
    total_trabajos: int = 0
    total_ganancias: float = 0.0
    comisiones_mes: float = 0.0

    class Config:
        from_attributes = True

# Schema para asignación de mecánico a trabajo
class AsignacionMecanico(BaseModel):
    id_mecanico: int = Field(..., description="ID del mecánico a asignar")
    porcentaje_comision: Optional[Union[int, float]] = Field(None, description="Porcentaje de comisión personalizado")

# Schema para respuesta de asignación
class AsignacionMecanicoResponse(BaseModel):
    id_trabajo: int
    id_mecanico: int
    nombre_mecanico: str
    porcentaje_comision: float
    monto_comision: float
    ganancia_trabajo: float

    class Config:
        from_attributes = True
