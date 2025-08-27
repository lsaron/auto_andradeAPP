from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, ForeignKey, Date
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from app.models.database import Base

class PagoSalario(Base):
    __tablename__ = "pagos_salarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_mecanico = Column(Integer, ForeignKey("mecanicos.id", ondelete="CASCADE"), nullable=False)
    monto_salario = Column(DECIMAL(10, 2), nullable=False)
    semana_pago = Column(String(10), nullable=False)  # MySQL usa VARCHAR(10) como en tu dump
    fecha_pago = Column(Date, nullable=False)  # MySQL usa DATE, no DATETIME
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    mecanico = relationship("Mecanico", back_populates="pagos_salarios")
