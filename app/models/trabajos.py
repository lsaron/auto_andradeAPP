from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, DECIMAL, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, timezone

class Trabajo(Base):
    __tablename__ = "trabajos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    matricula_carro = Column(String(20), ForeignKey("carros.matricula", ondelete="CASCADE"))
    descripcion = Column(String(255))
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    costo = Column(DECIMAL(10, 2))  # Total cobrado al cliente
    mano_obra = Column(DECIMAL(10, 2), default=0.00)  # Monto de mano de obra del trabajo
    markup_repuestos = Column(DECIMAL(10, 2), default=0.00)  # Markup aplicado a los repuestos
    ganancia = Column(DECIMAL(10, 2), default=0.00)  # Ganancia neta del trabajo
    aplica_iva = Column(Boolean, nullable=False, default=True)
    
    carro = relationship("Carro", back_populates="trabajos")
    detalle_gastos = relationship("DetalleGasto", back_populates="trabajo", cascade="all, delete")
    
    # Nuevas relaciones para mecánicos y comisiones
    mecanicos_asignados = relationship("TrabajoMecanico", back_populates="trabajo", cascade="all, delete-orphan")
    comisiones_mecanicos = relationship("ComisionMecanico", back_populates="trabajo", cascade="all, delete-orphan")
