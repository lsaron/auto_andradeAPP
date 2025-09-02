#!/usr/bin/env python3
"""
Script para probar la creación de mecánicos
"""

import requests
import json
from datetime import datetime

def test_crear_mecanico():
    print("🔧 Probando creación de mecánico...")
    
    # Datos del mecánico de prueba
    mecanico_data = {
        "id_nacional": "TEST001",
        "nombre": "Mecánico de Prueba",
        "telefono": "8888-8888",
        "porcentaje_comision": 2.00,
        "fecha_contratacion": "2025-09-01"
    }
    
    try:
        print(f"📤 Enviando datos: {json.dumps(mecanico_data, indent=2)}")
        
        response = requests.post(
            "http://localhost:8000/api/mecanicos/",
            json=mecanico_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📊 Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            mecanico_creado = response.json()
            print(f"✅ Mecánico creado exitosamente:")
            print(f"   - ID: {mecanico_creado['id']}")
            print(f"   - ID Nacional: {mecanico_creado['id_nacional']}")
            print(f"   - Nombre: {mecanico_creado['nombre']}")
            print(f"   - Teléfono: {mecanico_creado.get('telefono')}")
            print(f"   - Porcentaje: {mecanico_creado.get('porcentaje_comision')}")
            print(f"   - Fecha: {mecanico_creado.get('fecha_contratacion')}")
        else:
            print(f"❌ Error al crear mecánico:")
            print(f"   - Status: {response.status_code}")
            print(f"   - Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_crear_mecanico()
