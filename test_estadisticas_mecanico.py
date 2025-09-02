#!/usr/bin/env python3
"""
Script para probar el endpoint de estadísticas del mecánico
"""

import requests
import json

def test_estadisticas_mecanico():
    print("🔧 Probando endpoint de estadísticas del mecánico...")
    print("=" * 50)
    
    try:
        # 1. Primero obtener la lista de mecánicos
        print("📋 Obteniendo lista de mecánicos...")
        response = requests.get("http://localhost:8000/api/mecanicos/")
        
        if response.status_code == 200:
            mecanicos = response.json()
            print(f"✅ Mecánicos obtenidos: {len(mecanicos)}")
            
            # Mostrar todos los mecánicos
            for mecanico in mecanicos:
                print(f"🔧 Mecánico ID {mecanico.get('id')}: {mecanico.get('nombre')}")
            
            # 2. Probar estadísticas para cada mecánico
            for mecanico in mecanicos:
                mecanico_id = mecanico.get('id')
                print(f"\n📊 Probando estadísticas para mecánico {mecanico_id} ({mecanico.get('nombre')})...")
                
                # Probar endpoint de estadísticas
                stats_response = requests.get(f"http://localhost:8000/api/mecanicos/{mecanico_id}/estadisticas")
                print(f"📊 Status Code: {stats_response.status_code}")
                
                if stats_response.status_code == 200:
                    stats = stats_response.json()
                    print(f"✅ Estadísticas obtenidas:")
                    print(f"   - Total trabajos: {stats.get('total_trabajos', 'N/A')}")
                    print(f"   - Total ganancias: {stats.get('total_ganancias', 'N/A')}")
                    print(f"   - Comisiones mes: {stats.get('comisiones_mes', 'N/A')}")
                else:
                    print(f"❌ Error al obtener estadísticas:")
                    print(f"   - Status: {stats_response.status_code}")
                    print(f"   - Response: {stats_response.text}")
                
                # Probar endpoint raw para debug
                print(f"🔍 Probando endpoint raw para debug...")
                raw_response = requests.get(f"http://localhost:8000/api/mecanicos/{mecanico_id}/estadisticas-raw")
                print(f"🔍 Raw Status Code: {raw_response.status_code}")
                
                if raw_response.status_code == 200:
                    raw_stats = raw_response.json()
                    print(f"✅ Raw estadísticas:")
                    print(f"   - Total trabajos: {raw_stats.get('total_trabajos', 'N/A')}")
                    print(f"   - Total ganancias: {raw_stats.get('total_ganancias', 'N/A')}")
                    print(f"   - Comisiones mes: {raw_stats.get('comisiones_mes', 'N/A')}")
                else:
                    print(f"❌ Error en raw estadísticas:")
                    print(f"   - Status: {raw_response.status_code}")
                    print(f"   - Response: {raw_response.text}")
                
                print("-" * 30)
        else:
            print(f"❌ Error al obtener mecánicos:")
            print(f"   - Status: {response.status_code}")
            print(f"   - Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_estadisticas_mecanico()
