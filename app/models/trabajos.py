from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
from sqlalchemy import Boolean

class Trabajo(Base):
    __tablename__ = "trabajos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    matricula_carro = Column(String(20), ForeignKey("carros.matricula", ondelete="CASCADE"))  # 👈 Se usa la matrícula del carro
    descripcion = Column(String(255))
    fecha = Column(DateTime, default=datetime.utcnow)
    costo = Column(Integer)
    aplica_iva = Column(Boolean, nullable=False, default=True)  # ✅ NUEVO CAMPO
    carro = relationship("Carro", back_populates="trabajos")  # 👈 Agregar esto si falta
    detalle_gastos = relationship("DetalleGasto", back_populates="trabajo", cascade="all, delete")
