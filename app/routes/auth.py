import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.admin_taller import AdminTaller
from app.schemas.auth import AuthRequest, AuthResponse

router = APIRouter()

@router.post("/auth", response_model=AuthResponse)
def autenticar_usuario(auth_data: AuthRequest, db: Session = Depends(get_db)):
    """
    Autentica un usuario del taller usando username y password hash
    """
    try:
        # Buscar el usuario en la base de datos
        admin = db.query(AdminTaller).filter(AdminTaller.username == auth_data.username).first()
        
        if not admin:
            return AuthResponse(
                success=False,
                message="Usuario no encontrado"
            )
        
        # Generar hash SHA1 del password proporcionado
        password_hash = hashlib.sha1(auth_data.password.encode('utf-8')).hexdigest()
        
        # Comparar con el hash almacenado
        if password_hash == admin.password_hash:
            return AuthResponse(
                success=True,
                message="Autenticación exitosa",
                nombre_completo=admin.nombre_completo
            )
        else:
            return AuthResponse(
                success=False,
                message="Contraseña incorrecta"
            )
            
    except Exception as e:
        print(f"Error en autenticación: {str(e)}")
        return AuthResponse(
            success=False,
            message="Error interno del servidor"
        )
