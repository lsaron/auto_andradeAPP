from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from app.models.database import Base

class DetalleGasto(Base):
    __tablename__ = "detalles_gastos"

    id = Column(Integer, primary_key=True, index=True)
    id_trabajo = Column(Integer, ForeignKey("trabajos.id", ondelete="CASCADE"), nullable=False)
    descripcion = Column(String(255), nullable=False)
    monto = Column(Float, nullable=False)

    trabajo = relationship("Trabajo", back_populates="detalle_gastos")
