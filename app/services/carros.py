from sqlalchemy.orm import Session
from app.models.carros import Carro

def obtener_carro_por_matricula(db: Session, matricula: str):
    return db.query(Carro).filter(Carro.matricula == matricula).first()
