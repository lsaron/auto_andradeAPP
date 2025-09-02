#!/usr/bin/env python3
"""
Script para probar todos los endpoints que usa el reports-section
"""

import requests
import json
from datetime import datetime

def test_reports_endpoints():
    print("🔧 Probando endpoints del reports-section...")
    print("=" * 60)
    
    try:
        # 1. Probar endpoint de trabajos
        print("📊 Probando endpoint de trabajos...")
        response = requests.get("http://localhost:8000/api/trabajos/")
        
        if response.status_code == 200:
            trabajos = response.json()
            print(f"✅ Trabajos obtenidos: {len(trabajos)}")
            
            if trabajos:
                print("🔍 Primer trabajo:")
                trabajo = trabajos[0]
                print(f"   - ID: {trabajo.get('id')}")
                print(f"   - Fecha: {trabajo.get('fecha')}")
                print(f"   - Matrícula: {trabajo.get('matricula_carro')}")
                print(f"   - Descripción: {trabajo.get('descripcion')}")
                print(f"   - Costo: {trabajo.get('costo')}")
                print(f"   - Mano de obra: {trabajo.get('mano_obra')}")
                print(f"   - Ganancia: {trabajo.get('ganancia')}")
                print(f"   - Total gastos: {trabajo.get('total_gastos')}")
                
                # Verificar campos de mecánicos
                print("🔍 Campos de mecánicos:")
                print(f"   - mecanicos_ids: {trabajo.get('mecanicos_ids', 'No existe')}")
                print(f"   - mecanicos_nombres: {trabajo.get('mecanicos_nombres', 'No existe')}")
                print(f"   - total_mecanicos: {trabajo.get('total_mecanicos', 'No existe')}")
        else:
            print(f"❌ Error al obtener trabajos: {response.status_code}")
            print(f"   - Response: {response.text}")
        
        print("-" * 40)
        
        # 2. Probar endpoint de gastos del taller
        print("💰 Probando endpoint de gastos del taller...")
        response = requests.get("http://localhost:8000/api/gastos-taller/")
        
        if response.status_code == 200:
            gastos = response.json()
            print(f"✅ Gastos obtenidos: {len(gastos)}")
            
            if gastos:
                print("🔍 Primer gasto:")
                gasto = gastos[0]
                print(f"   - ID: {gasto.get('id')}")
                print(f"   - Fecha: {gasto.get('fecha_gasto')}")
                print(f"   - Descripción: {gasto.get('descripcion')}")
                print(f"   - Monto: {gasto.get('monto')}")
                print(f"   - Categoría: {gasto.get('categoria')}")
        else:
            print(f"❌ Error al obtener gastos: {response.status_code}")
            print(f"   - Response: {response.text}")
        
        print("-" * 40)
        
        # 3. Probar endpoint de pagos de salarios
        print("💵 Probando endpoint de pagos de salarios...")
        response = requests.get("http://localhost:8000/api/pagos-salarios/")
        
        if response.status_code == 200:
            pagos = response.json()
            print(f"✅ Pagos obtenidos: {len(pagos)}")
            
            if pagos:
                print("🔍 Primer pago:")
                pago = pagos[0]
                print(f"   - ID: {pago.get('id')}")
                print(f"   - Fecha: {pago.get('fecha_pago')}")
                print(f"   - ID Mecánico: {pago.get('id_mecanico')}")
                print(f"   - Nombre Mecánico: {pago.get('nombre_mecanico')}")
                print(f"   - Monto: {pago.get('monto_salario')}")
                print(f"   - Semana: {pago.get('semana_pago')}")
        else:
            print(f"❌ Error al obtener pagos: {response.status_code}")
            print(f"   - Response: {response.text}")
        
        print("-" * 40)
        
        # 4. Verificar datos en la base de datos según el dump
        print("📋 Verificando datos según el dump de la base de datos...")
        print("🔍 Según el dump:")
        print("   - Trabajos: 1 registro (ID: 1, fecha: 2025-09-01)")
        print("   - Gastos del taller: 0 registros")
        print("   - Pagos de salarios: 0 registros")
        print("   - Comisiones mecánicos: 1 registro (ID: 1, trabajo: 1, mecánico: 5)")
        
        # 5. Verificar si los datos coinciden
        print("\n🔍 Comparación con datos reales:")
        print(f"   - Trabajos en API: {len(trabajos) if 'trabajos' in locals() else 'Error'}")
        print(f"   - Gastos en API: {len(gastos) if 'gastos' in locals() else 'Error'}")
        print(f"   - Pagos en API: {len(pagos) if 'pagos' in locals() else 'Error'}")
        
        # 6. Verificar fechas de los datos
        if 'trabajos' in locals() and trabajos:
            print("\n📅 Fechas de trabajos disponibles:")
            for trabajo in trabajos:
                fecha = trabajo.get('fecha')
                if fecha:
                    try:
                        fecha_obj = datetime.fromisoformat(fecha.replace('Z', '+00:00'))
                        print(f"   - {fecha} -> {fecha_obj.strftime('%Y-%m-%d')} (Mes: {fecha_obj.month})")
                    except:
                        print(f"   - {fecha} -> Error al parsear")
        
        if 'gastos' in locals() and gastos:
            print("\n📅 Fechas de gastos disponibles:")
            for gasto in gastos:
                fecha = gasto.get('fecha_gasto')
                if fecha:
                    try:
                        fecha_obj = datetime.fromisoformat(fecha)
                        print(f"   - {fecha} -> {fecha_obj.strftime('%Y-%m-%d')} (Mes: {fecha_obj.month})")
                    except:
                        print(f"   - {fecha} -> Error al parsear")
        
        if 'pagos' in locals() and pagos:
            print("\n📅 Fechas de pagos disponibles:")
            for pago in pagos:
                fecha = pago.get('fecha_pago')
                if fecha:
                    try:
                        fecha_obj = datetime.fromisoformat(fecha)
                        print(f"   - {fecha} -> {fecha_obj.strftime('%Y-%m-%d')} (Mes: {fecha_obj.month})")
                    except:
                        print(f"   - {fecha} -> Error al parsear")
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_reports_endpoints()
