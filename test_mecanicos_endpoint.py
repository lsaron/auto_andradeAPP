#!/usr/bin/env python3
"""
Script para probar el endpoint de mecánicos
"""

import requests
import json

def test_mecanicos_endpoint():
    print("🔧 Probando endpoint de mecánicos...")
    print("=" * 50)
    
    try:
        # 1. Obtener todos los mecánicos
        print("📋 Obteniendo lista de mecánicos...")
        response = requests.get("http://localhost:8000/api/mecanicos/")
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            mecanicos = response.json()
            print(f"✅ Mecánicos obtenidos: {len(mecanicos)}")
            
            # Mostrar detalles de cada mecánico
            for i, mecanico in enumerate(mecanicos):
                print(f"\n🔧 Mecánico {i + 1}:")
                print(f"   - ID: {mecanico.get('id')}")
                print(f"   - ID Nacional: {mecanico.get('id_nacional', 'N/A')}")
                print(f"   - Nombre: {mecanico.get('nombre')}")
                print(f"   - Teléfono: {mecanico.get('telefono', 'N/A')}")
                print(f"   - Porcentaje: {mecanico.get('porcentaje_comision', 'N/A')}")
                print(f"   - Fecha: {mecanico.get('fecha_contratacion', 'N/A')}")
                print(f"   - Activo: {mecanico.get('activo', 'N/A')}")
        else:
            print(f"❌ Error al obtener mecánicos:")
            print(f"   - Status: {response.status_code}")
            print(f"   - Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_mecanicos_endpoint()
