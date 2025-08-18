from pydantic import BaseModel

class AuthRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    nombre_completo: str = None
