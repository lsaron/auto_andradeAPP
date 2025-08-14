#!/usr/bin/env python3
"""
Script de prueba para verificar la asignación de mecánicos a trabajos
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_asignacion_mecanicos():
    """Probar la asignación de mecánicos a un trabajo"""
    
    print("🔍 Probando asignación de mecánicos...")
    
    # 0. Primero obtener un carro existente o crear uno
    print("\n0️⃣ Obteniendo carro existente...")
    try:
        response = requests.get(f"{API_URL}/carros/")
        if response.status_code == 200:
            carros = response.json()
            if len(carros) > 0:
                carro = carros[0]
                matricula = carro['matricula']
                print(f"✅ Usando carro existente: {matricula}")
            else:
                print("❌ No hay carros disponibles. Creando uno de prueba...")
                # Crear un carro de prueba
                carro_data = {
                    "matricula": "TEST123",
                    "marca": "Toyota",
                    "modelo": "Corolla",
                    "anio": 2020,
                    "color": "Blanco"
                }
                response = requests.post(f"{API_URL}/carros/", json=carro_data)
                if response.status_code == 200:
                    carro = response.json()
                    matricula = carro['matricula']
                    print(f"✅ Carro creado: {matricula}")
                else:
                    print(f"❌ Error al crear carro: {response.status_code}")
                    return
        else:
            print(f"❌ Error al obtener carros: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error al obtener carros: {e}")
        return
    
    # 1. Crear un trabajo de prueba
    print("\n1️⃣ Creando trabajo de prueba...")
    trabajo_data = {
        "matricula_carro": matricula,
        "descripcion": "Trabajo de prueba para mecánicos",
        "fecha": datetime.now().strftime("%Y-%m-%d"),
        "costo": 100000,
        "aplica_iva": True,
        "detalle_gastos": [
            {
                "descripcion": "Material de prueba",
                "monto": 20000
            }
        ]
    }
    
    try:
        response = requests.post(f"{API_URL}/trabajos/", json=trabajo_data)
        print(f"🔍 Status code: {response.status_code}")
        print(f"🔍 Response text: {response.text}")
        
        if response.status_code == 200:
            trabajo = response.json()
            trabajo_id = trabajo["id"]
            print(f"✅ Trabajo creado con ID: {trabajo_id}")
            print(f"   Costo: ₡{trabajo['costo']:,}")
            print(f"   Gastos: ₡{sum(g['monto'] for g in trabajo_data['detalle_gastos']):,}")
            print(f"   Ganancia esperada: ₡{trabajo['costo'] - sum(g['monto'] for g in trabajo_data['detalle_gastos']):,}")
        else:
            print(f"❌ Error al crear trabajo: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error en la creación del trabajo: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 2. Obtener lista de mecánicos
    print("\n2️⃣ Obteniendo lista de mecánicos...")
    try:
        response = requests.get(f"{API_URL}/mecanicos/")
        if response.status_code == 200:
            mecanicos = response.json()
            print(f"✅ Mecánicos disponibles: {len(mecanicos)}")
            for m in mecanicos:
                print(f"   - {m['nombre']} (ID: {m['id']})")
            
            if len(mecanicos) == 0:
                print("❌ No hay mecánicos disponibles. Creando uno de prueba...")
                # Crear un mecánico de prueba
                mecanico_data = {
                    "id_nacional": "TEST001",
                    "nombre": "Mecánico de Prueba"
                }
                response = requests.post(f"{API_URL}/mecanicos/", json=mecanico_data)
                if response.status_code == 200:
                    mecanico = response.json()
                    print(f"✅ Mecánico creado: {mecanico['nombre']} (ID: {mecanico['id']})")
                    mecanicos = [mecanico]
                else:
                    print(f"❌ Error al crear mecánico: {response.status_code}")
                    return
        else:
            print(f"❌ Error al obtener mecánicos: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error al obtener mecánicos: {e}")
        return
    
    # 3. Asignar mecánicos al trabajo
    print("\n3️⃣ Asignando mecánicos al trabajo...")
    if len(mecanicos) > 0:
        # Tomar el primer mecánico disponible
        mecanico_id = mecanicos[0]["id"]
        asignacion_data = [
            {
                "id_mecanico": mecanico_id,
                "porcentaje_comision": 2.00
            }
        ]
        
        print(f"   Asignando mecánico ID {mecanico_id} al trabajo {trabajo_id}")
        
        try:
            response = requests.post(
                f"{API_URL}/mecanicos/trabajos/{trabajo_id}/asignar",
                json=asignacion_data
            )
            
            if response.status_code == 200:
                asignaciones = response.json()
                print(f"✅ Mecánicos asignados exitosamente: {len(asignaciones)}")
                for asignacion in asignaciones:
                    print(f"   - {asignacion['nombre_mecanico']}: ₡{asignacion['monto_comision']:,.2f}")
                    print(f"     Ganancia del trabajo: ₡{asignacion['ganancia_trabajo']:,.2f}")
            else:
                print(f"❌ Error al asignar mecánicos: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ Error en la asignación: {e}")
    else:
        print("❌ No hay mecánicos disponibles para asignar")
    
    # 4. Verificar que se guardaron en la base de datos
    print("\n4️⃣ Verificando estadísticas del mecánico...")
    if len(mecanicos) > 0:
        mecanico_id = mecanicos[0]["id"]
        try:
            response = requests.get(f"{API_URL}/mecanicos/{mecanico_id}/estadisticas")
            if response.status_code == 200:
                stats = response.json()
                print(f"✅ Estadísticas del mecánico {stats['nombre']}:")
                print(f"   - Trabajos completados: {stats['trabajos_completados']}")
                print(f"   - Total ganancias: ₡{stats['total_ganancias']:,.2f}")
                print(f"   - Total comisiones: ₡{stats['total_comisiones']:,.2f}")
            else:
                print(f"❌ Error al obtener estadísticas: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ Error al obtener estadísticas: {e}")
    
    print("\n🏁 Prueba completada!")

if __name__ == "__main__":
    test_asignacion_mecanicos()
