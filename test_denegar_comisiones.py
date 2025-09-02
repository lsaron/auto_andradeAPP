#!/usr/bin/env python3
"""
Script de prueba para verificar la función de denegar comisiones
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
MECANICO_ID = 4  # Mecánico específico mencionado en el problema
QUINCENA = "2025-Q2"  # Quincena actual

def test_denegar_comisiones():
    """Prueba la función de denegar comisiones"""
    
    print("🧪 Iniciando prueba de denegar comisiones...")
    print(f"📍 Mecánico ID: {MECANICO_ID}")
    print(f"📍 Quincena: {QUINCENA}")
    print("-" * 50)
    
    # 1. Obtener comisiones antes de denegar
    print("1️⃣ Obteniendo comisiones antes de denegar...")
    try:
        response = requests.get(f"{BASE_URL}/mecanicos/{MECANICO_ID}/comisiones/quincena/{QUINCENA}")
        if response.status_code == 200:
            comisiones_antes = response.json()
            print(f"✅ Comisiones encontradas: {len(comisiones_antes)}")
            
            # Mostrar comisiones PENDIENTES
            comisiones_pendientes = [c for c in comisiones_antes if c['estado_comision'] == 'PENDIENTE' and float(c['monto_comision']) > 0]
            print(f"📊 Comisiones PENDIENTES: {len(comisiones_pendientes)}")
            
            for c in comisiones_pendientes:
                print(f"   - ID: {c['id']}, Monto: {c['monto_comision']}, Estado: {c['estado_comision']}")
        else:
            print(f"❌ Error al obtener comisiones: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error en la conexión: {e}")
        return
    
    # 2. Denegar comisiones
    print("\n2️⃣ Denegando comisiones...")
    try:
        response = requests.post(
            f"{BASE_URL}/mecanicos/{MECANICO_ID}/comisiones/quincena/{QUINCENA}/estado",
            json={"aprobar": False},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ Comisiones denegadas exitosamente")
            print(f"📊 Resultado: {resultado}")
        else:
            print(f"❌ Error al denegar comisiones: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error en la conexión: {e}")
        return
    
    # 3. Obtener comisiones después de denegar
    print("\n3️⃣ Obteniendo comisiones después de denegar...")
    try:
        response = requests.get(f"{BASE_URL}/mecanicos/{MECANICO_ID}/comisiones/quincena/{QUINCENA}")
        if response.status_code == 200:
            comisiones_despues = response.json()
            print(f"✅ Comisiones encontradas: {len(comisiones_despues)}")
            
            # Mostrar comisiones por estado
            comisiones_por_estado = {}
            for c in comisiones_despues:
                estado = c['estado_comision']
                if estado not in comisiones_por_estado:
                    comisiones_por_estado[estado] = []
                comisiones_por_estado[estado].append(c)
            
            for estado, comisiones in comisiones_por_estado.items():
                print(f"📊 Comisiones {estado}: {len(comisiones)}")
                for c in comisiones:
                    print(f"   - ID: {c['id']}, Monto: {c['monto_comision']}, Estado: {c['estado_comision']}")
            
            # Verificar que no hay comisiones PENDIENTES con monto > 0
            comisiones_pendientes_despues = [c for c in comisiones_despues if c['estado_comision'] == 'PENDIENTE' and float(c['monto_comision']) > 0]
            if len(comisiones_pendientes_despues) == 0:
                print("✅ ✅ ✅ VERIFICACIÓN EXITOSA: No hay comisiones PENDIENTES con monto > 0")
            else:
                print(f"❌ ❌ ❌ ERROR: Aún hay {len(comisiones_pendientes_despues)} comisiones PENDIENTES con monto > 0")
                for c in comisiones_pendientes_despues:
                    print(f"   - ID: {c['id']}, Monto: {c['monto_comision']}, Estado: {c['estado_comision']}")
        else:
            print(f"❌ Error al obtener comisiones: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error en la conexión: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Prueba completada")

if __name__ == "__main__":
    test_denegar_comisiones()
