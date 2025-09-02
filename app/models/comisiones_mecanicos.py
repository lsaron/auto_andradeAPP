from sqlalchemy import Column, Integer, ForeignKey, DateTime, DECIMAL, String, Enum
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, timezone
from decimal import Decimal
import enum

class EstadoComision(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    APROBADA = "APROBADA"
    PENALIZADA = "PENALIZADA"
    DENEGADA = "DENEGADA"

class ComisionMecanico(Base):
    __tablename__ = "comisiones_mecanicos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_trabajo = Column(Integer, ForeignKey("trabajos.id", ondelete="CASCADE"), nullable=False)
    id_mecanico = Column(Integer, ForeignKey("mecanicos.id", ondelete="CASCADE"), nullable=False)
    ganancia_trabajo = Column(DECIMAL(10, 2), nullable=False)  # Ganancia base del trabajo (mano de obra - gastos reales)
    porcentaje_comision = Column(DECIMAL(5, 2), nullable=False, default=Decimal('2.00'))  # 2% fijo
    monto_comision = Column(DECIMAL(10, 2), nullable=False, default=Decimal('0.00'))  # Comisión calculada
    fecha_calculo = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    mes_reporte = Column(String(7), nullable=False)  # Formato: YYYY-MM para reportes mensuales
    estado_comision = Column(Enum(EstadoComision), nullable=False, default=EstadoComision.PENDIENTE)
    quincena = Column(String(7), nullable=True)  # Formato: YYYY-Q1, YYYY-Q2

    # Relaciones
    trabajo = relationship("Trabajo", back_populates="comisiones_mecanicos")
    mecanico = relationship("Mecanico", back_populates="comisiones")
