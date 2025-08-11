from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Configuración de la base de datos
DATABASE_URI = 'mysql+mysqlconnector://root:12070588Andre$@localhost:3306/auto_andrade'

# Motor de la base de datos
engine = create_engine(DATABASE_URI, echo=True)

# Sesiones para interactuar con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# ✅ Función para inyectar sesión en rutas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
