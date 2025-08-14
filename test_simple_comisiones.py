#!/usr/bin/env python3
"""
Script simple para probar las tablas de comisiones
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from decimal import Decimal
from datetime import datetime, timezone

# Configuración de la base de datos
DATABASE_URL = "mysql+pymysql://root:@localhost/auto_andrade"

def main():
    """Función principal"""
    print("🔍 Probando conexión a la base de datos...")
    
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            print("✅ Conexión exitosa")
            
            # Verificar que las tablas existen
            result = connection.execute(text("SHOW TABLES LIKE 'trabajos_mecanicos'"))
            if result.fetchone():
                print("✅ Tabla 'trabajos_mecanicos' existe")
            else:
                print("❌ Tabla 'trabajos_mecanicos' NO existe")
                return
            
            result = connection.execute(text("SHOW TABLES LIKE 'comisiones_mecanicos'"))
            if result.fetchone():
                print("✅ Tabla 'comisiones_mecanicos' existe")
            else:
                print("❌ Tabla 'comisiones_mecanicos' NO existe")
                return
            
            # Verificar que hay datos para probar
            result = connection.execute(text("SELECT COUNT(*) FROM trabajos"))
            trabajos_count = result.fetchone()[0]
            print(f"📊 Trabajos en BD: {trabajos_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM mecanicos WHERE activo = 1"))
            mecanicos_count = result.fetchone()[0]
            print(f"📊 Mecánicos activos en BD: {mecanicos_count}")
            
            if trabajos_count == 0 or mecanicos_count == 0:
                print("⚠️ No hay suficientes datos para probar")
                return
            
            print("\n✅ Las tablas están listas para funcionar")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
