from pydantic import BaseModel

class CarroSchema(BaseModel):
    matricula: str
    marca: str
    modelo: str
    anio: int
    id_cliente_actual: str

    class Config:
        from_attributes = True
