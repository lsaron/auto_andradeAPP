from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Text, Enum
from datetime import datetime, timezone
from app.models.database import Base
import enum

class EstadoGasto(enum.Enum):
    PENDIENTE = "PENDIENTE"
    PAGADO = "PAGADO"

class GastoTaller(Base):
    __tablename__ = "gastos_taller"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    descripcion = Column(Text, nullable=False)
    monto = Column(DECIMAL(10, 2), nullable=False)
    categoria = Column(String(100), nullable=False)
    fecha_gasto = Column(DateTime, nullable=False)
    fecha_pago = Column(DateTime, nullable=True)  # Nueva columna para fecha de pago
    estado = Column(Enum(EstadoGasto), nullable=False, default=EstadoGasto.PENDIENTE)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
