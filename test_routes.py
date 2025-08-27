#!/usr/bin/env python3
"""
Script de prueba para verificar las rutas de la API
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api"

def test_endpoints():
    """Prueba los endpoints principales"""
    
    print("🔍 Probando endpoints de la API...")
    
    # 1. Probar endpoint raíz
    try:
        response = requests.get("http://localhost:8000/")
        print(f"✅ Endpoint raíz: {response.status_code}")
        print(f"   Respuesta: {response.json()}")
    except Exception as e:
        print(f"❌ Error en endpoint raíz: {e}")
    
    # 2. Probar endpoint de pagos de salarios
    try:
        response = requests.get(f"{BASE_URL}/pagos-salarios")
        print(f"✅ Endpoint pagos-salarios: {response.status_code}")
        if response.status_code == 200:
            print(f"   Respuesta: {response.json()}")
    except Exception as e:
        print(f"❌ Error en pagos-salarios: {e}")
    
    # 3. Probar endpoint de mecánicos
    try:
        response = requests.get(f"{BASE_URL}/mecanicos")
        print(f"✅ Endpoint mecánicos: {response.status_code}")
        if response.status_code == 200:
            mecanicos = response.json()
            print(f"   Mecánicos encontrados: {len(mecanicos)}")
            if mecanicos:
                print(f"   Primer mecánico: {mecanicos[0]['nombre']}")
    except Exception as e:
        print(f"❌ Error en mecánicos: {e}")
    
    # 4. Probar endpoint de comisiones por quincena
    try:
        # Usar el primer mecánico disponible
        response = requests.get(f"{BASE_URL}/mecanicos")
        if response.status_code == 200:
            mecanicos = response.json()
            if mecanicos:
                mecanico_id = mecanicos[0]['id']
                quincena = f"{datetime.now().year}-Q1"
                response_comisiones = requests.get(f"{BASE_URL}/mecanicos/{mecanico_id}/comisiones/quincena/{quincena}")
                print(f"✅ Endpoint comisiones quincena: {response_comisiones.status_code}")
                if response_comisiones.status_code == 200:
                    comisiones = response_comisiones.json()
                    print(f"   Comisiones encontradas: {len(comisiones)}")
                else:
                    print(f"   Respuesta: {response_comisiones.text}")
    except Exception as e:
        print(f"❌ Error en comisiones quincena: {e}")
    
    # 5. Probar creación de pago de salario
    try:
        pago_data = {
            "id_mecanico": 1,
            "monto_salario": 100000.00,
            "semana_pago": "1",
            "fecha_pago": "2025-01-27"
        }
        
        response = requests.post(f"{BASE_URL}/pagos-salarios", json=pago_data)
        print(f"✅ Crear pago salario: {response.status_code}")
        if response.status_code == 201 or response.status_code == 200:
            print(f"   Pago creado: {response.json()}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Error al crear pago: {e}")

if __name__ == "__main__":
    print("🚀 Iniciando pruebas de la API...")
    test_endpoints()
    print("🏁 Pruebas completadas")
