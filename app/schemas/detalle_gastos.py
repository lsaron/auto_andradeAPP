from pydantic import BaseModel

class DetalleGastoSchema(BaseModel):
    descripcion: str
    monto: float

    class Config:
        from_attributes = True  # Para compatibilidad con Pydantic v2
