from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class HistorialDueno(Base):
    __tablename__ = "historial_duenos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    matricula_carro = Column(String(20), ForeignKey("carros.matricula", ondelete="CASCADE"))
    id_cliente = Column(String(20), ForeignKey("clientes.id_nacional", ondelete="SET NULL"))
    fecha_inicio = Column(DateTime, default=datetime.utcnow)
    fecha_fin = Column(DateTime, nullable=True)

    carro = relationship("Carro", back_populates="historial_duenos")
    cliente = relationship("Cliente", back_populates="historial_duenos")
