from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class HistorialDuenoSchema(BaseModel):
    matricula_carro: str
    id_cliente: str
    fecha_cambio: Optional[str] = None  # Fecha del cambio en formato string
    motivo_cambio: Optional[str] = None  # Motivo del cambio

    class Config:
        from_attributes = True  # Compatibilidad con Pydantic v2
