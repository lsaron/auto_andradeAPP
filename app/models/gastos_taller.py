from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Text
from datetime import datetime, timezone
from app.models.database import Base

class GastoTaller(Base):
    __tablename__ = "gastos_taller"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    descripcion = Column(Text, nullable=False)
    monto = Column(DECIMAL(10, 2), nullable=False)
    categoria = Column(String(100), nullable=False)
    fecha_gasto = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
