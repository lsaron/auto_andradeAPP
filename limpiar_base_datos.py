#!/usr/bin/env python3
"""
Script para limpiar la base de datos de datos de prueba
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text

# Configuración de la base de datos
DATABASE_URL = "mysql+pymysql://root:@localhost/auto_andrade"

def limpiar_base_datos():
    """Limpiar todos los datos de prueba de la base de datos"""
    print("🧹 Iniciando limpieza de la base de datos...")
    
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            print("✅ Conexión exitosa")
            
            # Verificar estado inicial
            print("\n📊 Estado inicial de las tablas:")
            tablas = ['carros', 'clientes', 'mecanicos', 'trabajos', 'detalles_gastos', 'historial_duenos', 'trabajos_mecanicos', 'comisiones_mecanicos']
            
            for tabla in tablas:
                result = connection.execute(text(f"SELECT COUNT(*) FROM {tabla}"))
                count = result.fetchone()[0]
                print(f"  - {tabla}: {count} registros")
            
            # Confirmar limpieza
            print("\n⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos")
            print("⚠️  Solo se mantendrá la estructura de las tablas")
            respuesta = input("¿Estás seguro de que quieres continuar? (escribe 'SI' para confirmar): ")
            
            if respuesta != 'SI':
                print("❌ Limpieza cancelada")
                return
            
            print("\n🧹 Iniciando limpieza...")
            
            # Desactivar foreign key checks
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            print("✅ Foreign key checks desactivados")
            
            # Limpiar tablas en orden correcto
            tablas_limpiar = [
                'trabajos_mecanicos',
                'comisiones_mecanicos', 
                'detalles_gastos',
                'historial_duenos',
                'trabajos',
                'carros',
                'clientes',
                'mecanicos'
            ]
            
            for tabla in tablas_limpiar:
                try:
                    connection.execute(text(f"TRUNCATE TABLE {tabla}"))
                    print(f"✅ Tabla {tabla} limpiada")
                except Exception as e:
                    print(f"⚠️  Error limpiando {tabla}: {e}")
            
            # Reactivar foreign key checks
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            print("✅ Foreign key checks reactivados")
            
            # Verificar estado final
            print("\n📊 Estado final de las tablas:")
            for tabla in tablas:
                result = connection.execute(text(f"SELECT COUNT(*) FROM {tabla}"))
                count = result.fetchone()[0]
                print(f"  - {tabla}: {count} registros")
            
            print("\n✅ ¡Limpieza completada exitosamente!")
            print("🔍 Todas las tablas están vacías pero mantienen su estructura")
            print("📝 Ahora puedes insertar nuevos datos limpios para probar el sistema")
            
    except Exception as e:
        print(f"❌ Error durante la limpieza: {e}")
        import traceback
        traceback.print_exc()

def verificar_estructura_tablas():
    """Verificar que las tablas mantienen su estructura después de la limpieza"""
    print("\n🔍 Verificando estructura de las tablas...")
    
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            tablas_principales = ['carros', 'clientes', 'mecanicos', 'trabajos', 'trabajos_mecanicos', 'comisiones_mecanicos']
            
            for tabla in tablas_principales:
                print(f"\n📋 Estructura de tabla '{tabla}':")
                result = connection.execute(text(f"DESCRIBE {tabla}"))
                for row in result:
                    print(f"  - {row[0]}: {row[1]} ({row[2]})")
                    
    except Exception as e:
        print(f"❌ Error verificando estructura: {e}")

def main():
    """Función principal"""
    print("🧹 LIMPIADOR DE BASE DE DATOS - AUTO ANDRADE")
    print("=" * 50)
    
    # Opciones
    print("\nOpciones disponibles:")
    print("1. Limpiar base de datos")
    print("2. Verificar estructura de tablas")
    print("3. Salir")
    
    while True:
        opcion = input("\nSelecciona una opción (1-3): ")
        
        if opcion == "1":
            limpiar_base_datos()
        elif opcion == "2":
            verificar_estructura_tablas()
        elif opcion == "3":
            print("👋 ¡Hasta luego!")
            break
        else:
            print("❌ Opción no válida. Intenta de nuevo.")

if __name__ == "__main__":
    main()
