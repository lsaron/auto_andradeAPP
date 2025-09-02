#!/usr/bin/env python3
"""
Script de debug para identificar el problema con la denegación de comisiones
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api"

def debug_denegacion_comisiones():
    """Debug del proceso de denegación de comisiones"""
    
    print("🔍 Iniciando debug de denegación de comisiones...")
    
    # 1. Obtener mecánicos
    print("\n1️⃣ Obteniendo mecánicos...")
    response = requests.get(f"{BASE_URL}/mecanicos")
    if response.status_code != 200:
        print(f"❌ Error al obtener mecánicos: {response.status_code}")
        return
    
    mecanicos = response.json()
    if len(mecanicos) == 0:
        print("❌ No hay mecánicos disponibles")
        return
    
    mecanico_id = mecanicos[0]['id']
    print(f"✅ Usando mecánico: {mecanicos[0]['nombre']} (ID: {mecanico_id})")
    
    # 2. Verificar comisiones existentes
    print(f"\n2️⃣ Verificando comisiones existentes...")
    quincena = f"{datetime.now().year}-Q1"
    
    response = requests.get(f"{BASE_URL}/mecanicos/{mecanico_id}/comisiones/quincena/{quincena}")
    print(f"📡 Status de respuesta: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ Error al obtener comisiones: {response.text}")
        return
    
    comisiones = response.json()
    print(f"✅ Comisiones encontradas: {len(comisiones)}")
    
    if len(comisiones) == 0:
        print("❌ No hay comisiones para denegar")
        return
    
    # Mostrar comisiones antes de denegar
    print("\n📊 Comisiones antes de denegar:")
    for c in comisiones:
        print(f"   - ID: {c['id']}, Trabajo: {c['id_trabajo']}, Monto: ₡{c['monto_comision']}, Estado: {c['estado_comision']}")
    
    # 3. Intentar denegar comisiones
    print(f"\n3️⃣ Intentando denegar comisiones...")
    
    response = requests.post(
        f"{BASE_URL}/mecanicos/{mecanico_id}/comisiones/quincena/{quincena}/estado",
        json={"aprobar": False}
    )
    
    print(f"📡 Status de respuesta: {response.status_code}")
    print(f"📡 Headers: {dict(response.headers)}")
    
    if response.status_code != 200:
        print(f"❌ Error al denegar comisiones:")
        print(f"   Status: {response.status_code}")
        print(f"   Text: {response.text}")
        return
    
    resultado = response.json()
    print(f"✅ Resultado de denegación: {resultado}")
    
    # 4. Verificar comisiones después de denegar
    print(f"\n4️⃣ Verificando comisiones después de denegar...")
    
    response = requests.get(f"{BASE_URL}/mecanicos/{mecanico_id}/comisiones/quincena/{quincena}")
    if response.status_code != 200:
        print(f"❌ Error al obtener comisiones después: {response.status_code}")
        return
    
    comisiones_despues = response.json()
    print(f"✅ Comisiones después de denegar: {len(comisiones_despues)}")
    
    print("\n📊 Comisiones después de denegar:")
    for c in comisiones_despues:
        print(f"   - ID: {c['id']}, Trabajo: {c['id_trabajo']}, Monto: ₡{c['monto_comision']}, Estado: {c['estado_comision']}")
    
    # 5. Verificar cambios
    print(f"\n5️⃣ Verificando cambios...")
    
    comisiones_denegadas = [c for c in comisiones_despues if c['estado_comision'] == 'DENEGADA']
    comisiones_con_monto_cero = [c for c in comisiones_despues if float(c['monto_comision']) == 0]
    
    print(f"📊 Resumen:")
    print(f"   - Comisiones denegadas: {len(comisiones_denegadas)}")
    print(f"   - Comisiones con monto cero: {len(comisiones_con_monto_cero)}")
    print(f"   - Total comisiones: {len(comisiones_despues)}")
    
    if len(comisiones_denegadas) > 0:
        print("✅ SUCCESS: Se denegaron comisiones correctamente")
    else:
        print("❌ FAILURE: No se denegaron comisiones")
        
        # Debug adicional
        print("\n🔍 Debug adicional:")
        print(f"   - Comisiones originales: {len(comisiones)}")
        print(f"   - Comisiones después: {len(comisiones_despues)}")
        
        # Verificar si las comisiones son las mismas
        if len(comisiones) == len(comisiones_despues):
            print("   - Mismo número de comisiones (no se modificaron)")
        else:
            print("   - Diferente número de comisiones")

if __name__ == "__main__":
    debug_denegacion_comisiones()
