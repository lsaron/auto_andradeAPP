from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.models.clientes import TipoCliente

class ClienteSchema(BaseModel):
    id_nacional: str  # ✅ Ahora usamos id_nacional en lugar de id
    nombre: str
    apellido: Optional[str] = None
    correo: Optional[str] = None  # Cambiado a str para ser más flexible
    telefono: Optional[str] = None
    tipo_cliente: TipoCliente = TipoCliente.PERSONA

    class Config:
        from_attributes = True

class ClienteCreate(BaseModel):
    id_nacional: str
    nombre: str
    apellido: Optional[str] = None
    correo: Optional[str] = None  # Cambiado a str para ser más flexible
    telefono: Optional[str] = None
    tipo_cliente: TipoCliente = TipoCliente.PERSONA

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo: Optional[EmailStr] = None
    telefono: Optional[str] = None
    tipo_cliente: Optional[TipoCliente] = None

class ClienteConCarrosSchema(ClienteSchema):
    carros: List[dict]  # ✅ Para devolver los carros asociados en el GET
