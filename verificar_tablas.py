#!/usr/bin/env python3
"""
Script para verificar que las tablas de mecánicos existan en la base de datos
"""

import mysql.connector
from mysql.connector import Error

def verificar_tablas():
    connection = None
    try:
        # Conectar a la base de datos
        connection = mysql.connector.connect(
            host='localhost',
            database='auto_andrade',
            user='root',
            password=''
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Verificar si las tablas existen
            tablas_a_verificar = [
                'mecanicos',
                'trabajos_mecanicos', 
                'comisiones_mecanicos'
            ]
            
            print("🔍 Verificando tablas de mecánicos...")
            
            for tabla in tablas_a_verificar:
                cursor.execute(f"SHOW TABLES LIKE '{tabla}'")
                resultado = cursor.fetchone()
                
                if resultado:
                    print(f"✅ Tabla '{tabla}' existe")
                    
                    # Verificar estructura de la tabla
                    cursor.execute(f"DESCRIBE {tabla}")
                    columnas = cursor.fetchall()
                    print(f"   Columnas en {tabla}:")
                    for columna in columnas:
                        print(f"     - {columna[0]} ({columna[1]})")
                else:
                    print(f"❌ Tabla '{tabla}' NO existe")
            
            # Verificar si hay datos en las tablas
            print("\n🔍 Verificando datos en las tablas...")
            
            for tabla in tablas_a_verificar:
                cursor.execute(f"SELECT COUNT(*) FROM {tabla}")
                count = cursor.fetchone()[0]
                print(f"   Tabla '{tabla}': {count} registros")
            
            # Verificar relaciones
            print("\n🔍 Verificando relaciones...")
            
            # Verificar foreign keys
            cursor.execute("""
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    CONSTRAINT_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE REFERENCED_TABLE_SCHEMA = 'auto_andrade'
                AND TABLE_NAME IN ('mecanicos', 'trabajos_mecanicos', 'comisiones_mecanicos')
            """)
            
            foreign_keys = cursor.fetchall()
            if foreign_keys:
                print("   Foreign keys encontradas:")
                for fk in foreign_keys:
                    print(f"     - {fk[0]}.{fk[1]} -> {fk[3]}.{fk[4]}")
            else:
                print("   No se encontraron foreign keys")
                
    except Error as e:
        print(f"❌ Error de MySQL: {e}")
        print("💡 Sugerencia: Verifica que MySQL esté corriendo y las credenciales sean correctas")
    except Exception as e:
        print(f"❌ Error general: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Conexión cerrada")
        else:
            print("\n🔌 No se pudo cerrar la conexión (no estaba conectada)")

if __name__ == "__main__":
    verificar_tablas()
