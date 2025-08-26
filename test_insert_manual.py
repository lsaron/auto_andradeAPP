#!/usr/bin/env python3
"""
Script para probar inserción manual en las tablas de comisiones
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
    print("🔍 Probando inserción manual en tablas de comisiones...")
    
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            print("✅ Conexión exitosa")
            
            # Verificar que las tablas existen y están vacías
            result = connection.execute(text("SELECT COUNT(*) FROM trabajos_mecanicos"))
            trabajos_mecanicos_count = result.fetchone()[0]
            print(f"📊 Registros en trabajos_mecanicos: {trabajos_mecanicos_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM comisiones_mecanicos"))
            comisiones_count = result.fetchone()[0]
            print(f"📊 Registros en comisiones_mecanicos: {comisiones_count}")
            
            # Verificar que hay trabajos y mecánicos disponibles
            result = connection.execute(text("SELECT COUNT(*) FROM trabajos"))
            trabajos_count = result.fetchone()[0]
            print(f"📊 Total de trabajos: {trabajos_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM mecanicos WHERE activo = 1"))
            mecanicos_count = result.fetchone()[0]
            print(f"📊 Mecánicos activos: {mecanicos_count}")
            
            if trabajos_count == 0 or mecanicos_count == 0:
                print("❌ No hay suficientes datos para probar")
                return
            
            # Obtener el primer trabajo y mecánico
            result = connection.execute(text("SELECT id, descripcion, costo FROM trabajos LIMIT 1"))
            trabajo = result.fetchone()
            trabajo_id = trabajo[0]
            trabajo_desc = trabajo[1]
            trabajo_costo = trabajo[2]
            
            result = connection.execute(text("SELECT id, nombre FROM mecanicos WHERE activo = 1 LIMIT 1"))
            mecanico = result.fetchone()
            mecanico_id = mecanico[0]
            mecanico_nombre = mecanico[1]
            
            print(f"🔍 Probando con trabajo ID: {trabajo_id} - {trabajo_desc} - Costo: {trabajo_costo}")
            print(f"🔍 Probando con mecánico ID: {mecanico_id} - {mecanico_nombre}")
            
            # Calcular comisión (2% del costo - solo para test, en producción se usa ganancia base)
            comision = Decimal(str(trabajo_costo)) * Decimal('0.02')
            print(f"🔍 Comisión calculada (test): {comision}")
            print(f"⚠️  NOTA: En producción, las comisiones se calculan sobre la ganancia base (mano de obra - gastos)")
            
            # Probar inserción en trabajos_mecanicos
            try:
                print("\n🔍 Insertando en trabajos_mecanicos...")
                connection.execute(text("""
                    INSERT INTO trabajos_mecanicos (id_trabajo, id_mecanico, porcentaje_comision, monto_comision)
                    VALUES (:trabajo_id, :mecanico_id, :porcentaje, :monto)
                """), {
                    "trabajo_id": trabajo_id,
                    "mecanico_id": mecanico_id,
                    "porcentaje": Decimal('2.00'),
                    "monto": comision
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
                    print("✅ Inserción en trabajos_mecanicos exitosa")
                else:
                    print("❌ Inserción en trabajos_mecanicos falló")
                
            except Exception as e:
                print(f"❌ Error insertando en trabajos_mecanicos: {e}")
                return
            
            # Probar inserción en comisiones_mecanicos
            try:
                print("\n🔍 Insertando en comisiones_mecanicos...")
                connection.execute(text("""
                    INSERT INTO comisiones_mecanicos (id_trabajo, id_mecanico, ganancia_trabajo, porcentaje_comision, monto_comision, mes_reporte)
                    VALUES (:trabajo_id, :mecanico_id, :ganancia, :porcentaje, :monto, :mes)
                """), {
                    "trabajo_id": trabajo_id,
                    "mecanico_id": mecanico_id,
                    "ganancia": Decimal(str(trabajo_costo)),  # Solo para test - en producción es ganancia base
                    "porcentaje": Decimal('2.00'),
                    "monto": comision,
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
                    print("✅ Inserción en comisiones_mecanicos exitosa")
                else:
                    print("❌ Inserción en comisiones_mecanicos falló")
                
            except Exception as e:
                print(f"❌ Error insertando en comisiones_mecanicos: {e}")
                return
            
            # Verificar el estado final
            result = connection.execute(text("SELECT COUNT(*) FROM trabajos_mecanicos"))
            final_trabajos_count = result.fetchone()[0]
            print(f"\n📊 Registros finales en trabajos_mecanicos: {final_trabajos_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM comisiones_mecanicos"))
            final_comisiones_count = result.fetchone()[0]
            print(f"📊 Registros finales en comisiones_mecanicos: {final_comisiones_count}")
            
            if final_trabajos_count > trabajos_mecanicos_count and final_comisiones_count > comisiones_count:
                print("\n✅ ¡PRUEBA EXITOSA! Las tablas funcionan correctamente")
                print("🔍 El problema está en el código de la aplicación, no en las tablas")
            else:
                print("\n❌ Las tablas tienen problemas")
            
    except Exception as e:
        print(f"❌ Error general: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
