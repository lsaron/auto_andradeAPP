from sqlalchemy.orm import Session
from app.models.clientes import Cliente

def obtener_cliente_por_id(db: Session, id_cliente: int):
    return db.query(Cliente).filter(Cliente.id == id_cliente).first()
