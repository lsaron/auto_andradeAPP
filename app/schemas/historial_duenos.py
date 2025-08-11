from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class HistorialDuenoSchema(BaseModel):
    matricula_carro: str
    id_cliente: str
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None

    class Config:
        from_attributes = True  # Compatibilidad con Pydantic v2
