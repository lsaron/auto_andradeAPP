from sqlalchemy.orm import Session
from .clientes import Cliente
from .carros import Carro
from .trabajos import Trabajo
from .historial_duenos import HistorialDueno
from .detalle_gastos import DetalleGasto
from .mecanicos import Mecanico
from .trabajos_mecanicos import TrabajoMecanico
from .comisiones_mecanicos import ComisionMecanico
from .admin_taller import AdminTaller
from .gastos_taller import GastoTaller
from .pagos_salarios import PagoSalario


def obtener_cliente_por_id(db: Session, id_cliente: str):
    return db.query(Cliente).filter(Cliente.id_nacional == id_cliente).first()
