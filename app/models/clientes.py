from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from .database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id_nacional = Column(String(20), primary_key=True, unique=True, index=True)
    nombre = Column(String(100))
    apellido = Column(String(100), nullable=True)
    correo = Column(String(100), nullable=True)
    telefono = Column(String(20))

    # ✅ Relación con Carros
    carros = relationship("Carro", back_populates="cliente_actual")

    # ✅ Relación con Historial de Dueños
    historial_duenos = relationship("HistorialDueno", back_populates="cliente", cascade="all, delete-orphan")
