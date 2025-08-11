from pydantic import BaseModel, EmailStr
from typing import Optional, List

class ClienteSchema(BaseModel):
    id_nacional: str  # ✅ Ahora usamos id_nacional en lugar de id
    nombre: str
    correo: Optional[EmailStr] = None
    telefono: str

    class Config:
        from_attributes = True

class ClienteConCarrosSchema(ClienteSchema):
    carros: List[dict]  # ✅ Para devolver los carros asociados en el GET
