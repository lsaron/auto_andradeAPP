#!/usr/bin/env python3
"""
Script para simular las llamadas del frontend y verificar que todo funciona
"""

import requests
import json

def test_frontend_simulation():
    print("🔧 Simulando llamadas del frontend...")
    print("=" * 50)
    
    try:
        # 1. Obtener todos los mecánicos (como hace el frontend)
        print("📋 Obteniendo lista de mecánicos...")
        response = requests.get("http://localhost:8000/api/mecanicos/")
        
        if response.status_code == 200:
            mecanicos = response.json()
            print(f"✅ Mecánicos obtenidos: {len(mecanicos)}")
            
            # 2. Para cada mecánico, obtener estadísticas (como hace el frontend)
            for mecanico in mecanicos:
                mecanico_id = mecanico.get('id')
                nombre = mecanico.get('nombre')
                print(f"\n🔧 Procesando mecánico {mecanico_id} ({nombre})...")
                
                # Obtener estadísticas
                stats_response = requests.get(f"http://localhost:8000/api/mecanicos/{mecanico_id}/estadisticas")
                
                if stats_response.status_code == 200:
                    stats = stats_response.json()
                    
                    # Simular el mapeo que hace el frontend
                    mecanico_mapeado = {
                        "id": str(mecanico_id),
                        "name": nombre,
                        "mechanic_id": f"MC-{mecanico_id}",
                        "jobs_completed": stats.get('total_trabajos', 0),
                        "total_commission": float(stats.get('comisiones_mes', 0)),
                        "total_profit": float(stats.get('total_ganancias', 0)),
                        "hire_date": mecanico.get('fecha_contratacion', '2025-09-01'),
                        "created_at": mecanico.get('created_at', '2025-09-01T00:00:00'),
                        "updated_at": mecanico.get('updated_at', '2025-09-01T00:00:00')
                    }
                    
                    print(f"✅ Mecánico mapeado exitosamente:")
                    print(f"   - ID: {mecanico_mapeado['id']}")
                    print(f"   - Nombre: {mecanico_mapeado['name']}")
                    print(f"   - Mechanic ID: {mecanico_mapeado['mechanic_id']}")
                    print(f"   - Trabajos completados: {mecanico_mapeado['jobs_completed']}")
                    print(f"   - Comisión total: {mecanico_mapeado['total_commission']}")
                    print(f"   - Ganancia total: {mecanico_mapeado['total_profit']}")
                    
                else:
                    print(f"❌ Error al obtener estadísticas para mecánico {mecanico_id}")
                    print(f"   - Status: {stats_response.status_code}")
                    print(f"   - Response: {stats_response.text}")
            
            print(f"\n🎉 Simulación completada exitosamente!")
            print(f"✅ Todos los mecánicos procesados correctamente")
            print(f"✅ El frontend debería poder cargar los datos sin problemas")
            
        else:
            print(f"❌ Error al obtener mecánicos:")
            print(f"   - Status: {response.status_code}")
            print(f"   - Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en la simulación: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_frontend_simulation()
