#!/usr/bin/env python3
"""
Script de prueba para la API de mecánicos
Auto Andrade - Sistema de Comisiones
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api"
HEADERS = {"Content-Type": "application/json"}

def test_mecanicos_api():
    """Prueba todas las funcionalidades de la API de mecánicos"""
    
    print("🔧 Probando API de Mecánicos")
    print("=" * 50)
    
    # 1. Crear un mecánico de prueba
    print("\n1. Creando mecánico de prueba...")
    mecanico_data = {
        "id_nacional": "TEST001",
        "nombre": "Mecánico de Prueba",
        "correo": "test@taller.com",
        "telefono": "8888-8888",
        "porcentaje_comision": 2.00
    }
    
    try:
        response = requests.post(f"{BASE_URL}/mecanicos/", json=mecanico_data, headers=HEADERS)
        if response.status_code == 200:
            mecanico_creado = response.json()
            print(f"✅ Mecánico creado: {mecanico_creado['nombre']} (ID: {mecanico_creado['id']})")
            mecanico_id = mecanico_creado['id']
        else:
            print(f"❌ Error al crear mecánico: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return
    
    # 2. Listar todos los mecánicos
    print("\n2. Listando mecánicos...")
    try:
        response = requests.get(f"{BASE_URL}/mecanicos/", headers=HEADERS)
        if response.status_code == 200:
            mecanicos = response.json()
            print(f"✅ Mecánicos encontrados: {len(mecanicos)}")
            for mech in mecanicos:
                print(f"   - {mech['nombre']} ({mech['id_nacional']})")
        else:
            print(f"❌ Error al listar mecánicos: {response.status_code}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
    
    # 3. Obtener mecánico específico
    print(f"\n3. Obteniendo mecánico ID {mecanico_id}...")
    try:
        response = requests.get(f"{BASE_URL}/mecanicos/{mecanico_id}", headers=HEADERS)
        if response.status_code == 200:
            mecanico = response.json()
            print(f"✅ Mecánico obtenido: {mecanico['nombre']}")
        else:
            print(f"❌ Error al obtener mecánico: {response.status_code}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
    
    # 4. Buscar mecánicos
    print("\n4. Buscando mecánicos...")
    try:
        response = requests.get(f"{BASE_URL}/mecanicos/buscar/?q=Prueba", headers=HEADERS)
        if response.status_code == 200:
            resultados = response.json()
            print(f"✅ Búsqueda exitosa: {len(resultados)} resultados")
        else:
            print(f"❌ Error en búsqueda: {response.status_code}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
    
    # 5. Obtener estadísticas del mecánico
    print(f"\n5. Obteniendo estadísticas del mecánico {mecanico_id}...")
    try:
        response = requests.get(f"{BASE_URL}/mecanicos/{mecanico_id}/estadisticas", headers=HEADERS)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Estadísticas obtenidas:")
            print(f"   - Trabajos completados: {stats.get('trabajos_completados', 0)}")
            print(f"   - Total ganancias: ₡{stats.get('total_ganancias', 0):,.2f}")
            print(f"   - Total comisiones: ₡{stats.get('total_comisiones', 0):,.2f}")
        else:
            print(f"❌ Error al obtener estadísticas: {response.status_code}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
    
    # 6. Obtener reporte mensual
    mes_actual = datetime.now().strftime("%Y-%m")
    print(f"\n6. Obteniendo reporte mensual {mes_actual}...")
    try:
        response = requests.get(f"{BASE_URL}/mecanicos/reporte/mensual/{mes_actual}", headers=HEADERS)
        if response.status_code == 200:
            reporte = response.json()
            print(f"✅ Reporte mensual obtenido: {len(reporte)} mecánicos")
        else:
            print(f"❌ Error al obtener reporte mensual: {response.status_code}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
    
    # 7. Actualizar mecánico
    print(f"\n7. Actualizando mecánico {mecanico_id}...")
    update_data = {
        "telefono": "9999-9999",
        "correo": "actualizado@taller.com"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/mecanicos/{mecanico_id}", json=update_data, headers=HEADERS)
        if response.status_code == 200:
            mecanico_actualizado = response.json()
            print(f"✅ Mecánico actualizado: {mecanico_actualizado['telefono']}")
        else:
            print(f"❌ Error al actualizar mecánico: {response.status_code}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Pruebas completadas")
    print(f"📝 Mecánico de prueba creado con ID: {mecanico_id}")
    print("💡 Puedes eliminar este mecánico desde la interfaz web si lo deseas")

if __name__ == "__main__":
    test_mecanicos_api()
