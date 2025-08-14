from sqlalchemy import Column, Integer, ForeignKey, DateTime, DECIMAL
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, timezone
from decimal import Decimal

class TrabajoMecanico(Base):
    __tablename__ = "trabajos_mecanicos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_trabajo = Column(Integer, ForeignKey("trabajos.id", ondelete="CASCADE"), nullable=False)
    id_mecanico = Column(Integer, ForeignKey("mecanicos.id", ondelete="CASCADE"), nullable=False)
    porcentaje_comision = Column(DECIMAL(5, 2), nullable=False, default=Decimal('2.00'))
    monto_comision = Column(DECIMAL(10, 2), nullable=False, default=Decimal('0.00'))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    trabajo = relationship("Trabajo", back_populates="mecanicos_asignados")
    mecanico = relationship("Mecanico", back_populates="trabajos_mecanicos")
