from app.config.database import engine

def test_db_connection():
    """
    Prueba simple para verificar si la conexión con la base de datos es exitosa.
    """
    try:
        # Intentar conectar con la base de datos
        with engine.connect() as connection:
            print("Conexión a la base de datos exitosa.")
    except Exception as e:
        # Imprimir el error en caso de falla
        print(f"Error al conectar a la base de datos: {e}")
