#!/usr/bin/env python3
"""
Script de prueba para el módulo de taller
Prueba las APIs de gastos del taller y pagos de salarios
"""

import requests
import json
from datetime import datetime, timedelta
from decimal import Decimal

# Configuración
BASE_URL = "http://localhost:8000/api"
HEADERS = {"Content-Type": "application/json"}

def test_gastos_taller():
    """Prueba las APIs de gastos del taller"""
    print("🧪 Probando APIs de Gastos del Taller...")
    
    # 1. Crear un gasto
    print("\n1. Creando gasto de prueba...")
    nuevo_gasto = {
        "descripcion": "Pago de internet del mes",
        "monto": 35000.00,
        "categoria": "servicios",
        "fecha_gasto": datetime.now().isoformat()
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/gastos-taller/",
            headers=HEADERS,
            json=nuevo_gasto
        )
        
        if response.status_code == 200:
            gasto_creado = response.json()
            print(f"✅ Gasto creado exitosamente: ID {gasto_creado['id']}")
            gasto_id = gasto_creado['id']
        else:
            print(f"❌ Error al crear gasto: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return
    
    # 2. Obtener el gasto creado
    print("\n2. Obteniendo gasto creado...")
    try:
        response = requests.get(f"{BASE_URL}/gastos-taller/{gasto_id}")
        if response.status_code == 200:
            gasto = response.json()
            print(f"✅ Gasto obtenido: {gasto['descripcion']} - ₡{gasto['monto']}")
        else:
            print(f"❌ Error al obtener gasto: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 3. Listar todos los gastos
    print("\n3. Listando todos los gastos...")
    try:
        response = requests.get(f"{BASE_URL}/gastos-taller/")
        if response.status_code == 200:
            gastos = response.json()
            print(f"✅ Total de gastos: {len(gastos)}")
            for gasto in gastos[:3]:  # Mostrar solo los primeros 3
                print(f"   - {gasto['descripcion']}: ₡{gasto['monto']}")
        else:
            print(f"❌ Error al listar gastos: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 4. Actualizar el gasto
    print("\n4. Actualizando gasto...")
    gasto_actualizado = {
        "descripcion": "Pago de internet del mes (actualizado)",
        "monto": 40000.00
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/gastos-taller/{gasto_id}",
            headers=HEADERS,
            json=gasto_actualizado
        )
        
        if response.status_code == 200:
            gasto = response.json()
            print(f"✅ Gasto actualizado: {gasto['descripcion']} - ₡{gasto['monto']}")
        else:
            print(f"❌ Error al actualizar: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 5. Obtener estadísticas
    print("\n5. Obteniendo estadísticas...")
    try:
        response = requests.get(f"{BASE_URL}/gastos-taller/estadisticas/resumen")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Estadísticas: {stats['total_gastos']} gastos, Total: ₡{stats['total_monto']}")
        else:
            print(f"❌ Error al obtener estadísticas: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 6. Eliminar el gasto de prueba
    print("\n6. Eliminando gasto de prueba...")
    try:
        response = requests.delete(f"{BASE_URL}/gastos-taller/{gasto_id}")
        if response.status_code == 200:
            print("✅ Gasto eliminado exitosamente")
        else:
            print(f"❌ Error al eliminar: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_pagos_salarios():
    """Prueba las APIs de pagos de salarios"""
    print("\n🧪 Probando APIs de Pagos de Salarios...")
    
    # 1. Obtener mecánicos disponibles
    print("\n1. Obteniendo mecánicos disponibles...")
    try:
        response = requests.get(f"{BASE_URL}/mecanicos/")
        if response.status_code == 200:
            mecanicos = response.json()
            if mecanicos:
                mecanico_id = mecanicos[0]['id']
                print(f"✅ Mecánico encontrado: {mecanicos[0]['nombre']} (ID: {mecanico_id})")
            else:
                print("⚠️ No hay mecánicos disponibles")
                return
        else:
            print(f"❌ Error al obtener mecánicos: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 2. Crear un pago de salario
    print("\n2. Creando pago de salario...")
         nuevo_pago = {
         "id_mecanico": mecanico_id,
         "monto_salario": 85000.00,
         "semana_pago": "2",
         "fecha_pago": datetime.now().isoformat()
     }
    
    try:
        response = requests.post(
            f"{BASE_URL}/pagos-salarios/",
            headers=HEADERS,
            json=nuevo_pago
        )
        
        if response.status_code == 200:
            pago_creado = response.json()
            print(f"✅ Pago creado exitosamente: ID {pago_creado['id']}")
            pago_id = pago_creado['id']
        else:
            print(f"❌ Error al crear pago: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 3. Obtener el pago creado
    print("\n3. Obteniendo pago creado...")
    try:
        response = requests.get(f"{BASE_URL}/pagos-salarios/{pago_id}")
        if response.status_code == 200:
            pago = response.json()
            print(f"✅ Pago obtenido: {pago['nombre_mecanico']} - ₡{pago['monto_salario']}")
        else:
            print(f"❌ Error al obtener pago: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 4. Listar todos los pagos
    print("\n4. Listando todos los pagos...")
    try:
        response = requests.get(f"{BASE_URL}/pagos-salarios/")
        if response.status_code == 200:
            pagos = response.json()
            print(f"✅ Total de pagos: {len(pagos)}")
            for pago in pagos[:3]:  # Mostrar solo los primeros 3
                print(f"   - {pago['nombre_mecanico']}: ₡{pago['monto_salario']}")
        else:
            print(f"❌ Error al listar pagos: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 5. Obtener estadísticas
    print("\n5. Obteniendo estadísticas...")
    try:
        response = requests.get(f"{BASE_URL}/pagos-salarios/estadisticas/resumen")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Estadísticas: {stats['total_pagos']} pagos, Total: ₡{stats['total_salarios']}")
        else:
            print(f"❌ Error al obtener estadísticas: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 6. Eliminar el pago de prueba
    print("\n6. Eliminando pago de prueba...")
    try:
        response = requests.delete(f"{BASE_URL}/pagos-salarios/{pago_id}")
        if response.status_code == 200:
            print("✅ Pago eliminado exitosamente")
        else:
            print(f"❌ Error al eliminar: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Función principal"""
    print("🚗 Auto Andrade - Pruebas del Módulo de Taller")
    print("=" * 50)
    
    # Verificar que el servidor esté ejecutándose
    try:
        response = requests.get("http://localhost:8000/")
        if response.status_code == 200:
            print("✅ Servidor backend ejecutándose correctamente")
        else:
            print("⚠️ Servidor backend respondiendo pero con estado inesperado")
    except Exception as e:
        print("❌ No se puede conectar al servidor backend")
        print("   Asegúrate de que esté ejecutándose en http://localhost:8000")
        return
    
    # Ejecutar pruebas
    try:
        test_gastos_taller()
        test_pagos_salarios()
        print("\n🎉 Todas las pruebas completadas")
    except KeyboardInterrupt:
        print("\n⏹️ Pruebas interrumpidas por el usuario")
    except Exception as e:
        print(f"\n💥 Error inesperado: {e}")

if __name__ == "__main__":
    main()
