from sqlalchemy import Column, String, Integer, DateTime, Boolean, DECIMAL
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Mecanico(Base):
    __tablename__ = "mecanicos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_nacional = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), nullable=True)
    telefono = Column(String(20), nullable=True)
    porcentaje_comision = Column(DECIMAL(5, 2), nullable=False, default=2.00)  # 2% fijo
    fecha_contratacion = Column(DateTime, default=datetime.utcnow)
    activo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    trabajos_mecanicos = relationship("TrabajoMecanico", back_populates="mecanico", cascade="all, delete-orphan")
    comisiones = relationship("ComisionMecanico", back_populates="mecanico", cascade="all, delete-orphan")
