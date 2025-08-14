#!/usr/bin/env python3
"""
Script de prueba para verificar las tablas de comisiones y trabajos_mecanicos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from decimal import Decimal
from datetime import datetime, timezone

# Configuración de la base de datos
DATABASE_URL = "mysql+pymysql://root:@localhost/auto_andrade"

def test_database_connection():
    """Probar conexión a la base de datos"""
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            print("✅ Conexión a la base de datos exitosa")
            return engine
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def test_tables_exist(engine):
    """Verificar que las tablas existen"""
    try:
        with engine.connect() as connection:
            # Verificar tabla trabajos_mecanicos
            result = connection.execute(text("SHOW TABLES LIKE 'trabajos_mecanicos'"))
            if result.fetchone():
                print("✅ Tabla 'trabajos_mecanicos' existe")
            else:
                print("❌ Tabla 'trabajos_mecanicos' NO existe")
                return False
            
            # Verificar tabla comisiones_mecanicos
            result = connection.execute(text("SHOW TABLES LIKE 'comisiones_mecanicos'"))
            if result.fetchone():
                print("✅ Tabla 'comisiones_mecanicos' existe")
            else:
                print("❌ Tabla 'comisiones_mecanicos' NO existe")
                return False
            
            return True
    except Exception as e:
        print(f"❌ Error verificando tablas: {e}")
        return False

def test_table_structure(engine):
    """Verificar la estructura de las tablas"""
    try:
        with engine.connect() as connection:
            print("\n📋 Estructura de tabla 'trabajos_mecanicos':")
            result = connection.execute(text("DESCRIBE trabajos_mecanicos"))
            for row in result:
                print(f"  - {row[0]}: {row[1]} ({row[2]})")
            
            print("\n📋 Estructura de tabla 'comisiones_mecanicos':")
            result = connection.execute(text("DESCRIBE comisiones_mecanicos"))
            for row in result:
                print(f"  - {row[0]}: {row[1]} ({row[2]})")
                
    except Exception as e:
        print(f"❌ Error verificando estructura: {e}")

def test_insert_data(engine):
    """Probar inserción de datos en las tablas"""
    try:
        with engine.connect() as connection:
            # Verificar que existe al menos un trabajo y un mecánico
            result = connection.execute(text("SELECT COUNT(*) FROM trabajos"))
            trabajos_count = result.fetchone()[0]
            print(f"📊 Total de trabajos en BD: {trabajos_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM mecanicos"))
            mecanicos_count = result.fetchone()[0]
            print(f"📊 Total de mecánicos en BD: {mecanicos_count}")
            
            if trabajos_count == 0:
                print("⚠️ No hay trabajos en la BD para probar")
                return False
            
            if mecanicos_count == 0:
                print("⚠️ No hay mecánicos en la BD para probar")
                return False
            
            # Obtener el primer trabajo y mecánico
            result = connection.execute(text("SELECT id FROM trabajos LIMIT 1"))
            trabajo_id = result.fetchone()[0]
            
            result = connection.execute(text("SELECT id FROM mecanicos WHERE activo = 1 LIMIT 1"))
            mecanico_id = result.fetchone()[0]
            
            print(f"🔍 Probando con trabajo ID: {trabajo_id}, mecánico ID: {mecanico_id}")
            
            # Probar inserción en trabajos_mecanicos
            try:
                connection.execute(text("""
                    INSERT INTO trabajos_mecanicos (id_trabajo, id_mecanico, porcentaje_comision, monto_comision)
                    VALUES (:trabajo_id, :mecanico_id, :porcentaje, :monto)
                """), {
                    "trabajo_id": trabajo_id,
                    "mecanico_id": mecanico_id,
                    "porcentaje": Decimal('2.00'),
                    "monto": Decimal('1000.00')
                })
                
                # Verificar que se insertó
                result = connection.execute(text("""
                    SELECT * FROM trabajos_mecanicos 
                    WHERE id_trabajo = :trabajo_id AND id_mecanico = :mecanico_id
                """), {
                    "trabajo_id": trabajo_id,
                    "mecanico_id": mecanico_id
                })
                
                if result.fetchone():
                    print("✅ Inserción en 'trabajos_mecanicos' exitosa")
                else:
                    print("❌ Inserción en 'trabajos_mecanicos' falló")
                
                # Limpiar datos de prueba
                connection.execute(text("""
                    DELETE FROM trabajos_mecanicos 
                    WHERE id_trabajo = :trabajo_id AND id_mecanico = :mecanico_id
                """), {
                    "trabajo_id": trabajo_id,
                    "mecanico_id": mecanico_id
                })
                
            except Exception as e:
                print(f"❌ Error insertando en trabajos_mecanicos: {e}")
                return False
            
            # Probar inserción en comisiones_mecanicos
            try:
                connection.execute(text("""
                    INSERT INTO comisiones_mecanicos (id_trabajo, id_mecanico, ganancia_trabajo, porcentaje_comision, monto_comision, mes_reporte)
                    VALUES (:trabajo_id, :mecanico_id, :ganancia, :porcentaje, :monto, :mes)
                """), {
                    "trabajo_id": trabajo_id,
                    "mecanico_id": mecanico_id,
                    "ganancia": Decimal('50000.00'),
                    "porcentaje": Decimal('2.00'),
                    "monto": Decimal('1000.00'),
                    "mes": datetime.now(timezone.utc).strftime('%Y-%m')
                })
                
                # Verificar que se insertó
                result = connection.execute(text("""
                    SELECT * FROM comisiones_mecanicos 
                    WHERE id_trabajo = :trabajo_id AND id_mecanico = :mecanico_id
                """), {
                    "trabajo_id": trabajo_id,
                    "mecanico_id": mecanico_id
                })
                
                if result.fetchone():
                    print("✅ Inserción en 'comisiones_mecanicos' exitosa")
                else:
                    print("❌ Inserción en 'comisiones_mecanicos' falló")
                
                # Limpiar datos de prueba
                connection.execute(text("""
                    DELETE FROM comisiones_mecanicos 
                    WHERE id_trabajo = :trabajo_id AND id_mecanico = :mecanico_id
                """), {
                    "trabajo_id": trabajo_id,
                    "mecanico_id": mecanico_id
                })
                
            except Exception as e:
                print(f"❌ Error insertando en comisiones_mecanicos: {e}")
                return False
            
            return True
            
    except Exception as e:
        print(f"❌ Error en prueba de inserción: {e}")
        return False

def main():
    """Función principal"""
    print("🔍 Iniciando pruebas de tablas de comisiones...")
    
    # Probar conexión
    engine = test_database_connection()
    if not engine:
        return
    
    # Verificar que las tablas existen
    if not test_tables_exist(engine):
        print("❌ Las tablas necesarias no existen")
        return
    
    # Verificar estructura
    test_table_structure(engine)
    
    # Probar inserción de datos
    if test_insert_data(engine):
        print("\n✅ Todas las pruebas pasaron correctamente")
    else:
        print("\n❌ Algunas pruebas fallaron")
    
    print("\n🏁 Pruebas completadas")

if __name__ == "__main__":
    main()
