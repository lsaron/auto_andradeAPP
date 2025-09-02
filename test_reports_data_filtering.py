#!/usr/bin/env python3
"""
Script de prueba para verificar que los datos se están filtrando correctamente por mes
"""

import requests
import json
from datetime import datetime
import sys

def test_data_filtering_by_month():
    """Prueba el filtrado de datos por mes"""
    
    print("🔍 Verificando filtrado de datos por mes...")
    
    # Obtener fecha actual
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    
    print(f"📅 Fecha actual: {now.strftime('%d/%m/%Y')}")
    print(f"📅 Año actual: {current_year}")
    print(f"📅 Mes actual: {current_month} ({now.strftime('%B')})")
    
    try:
        # Verificar que el servidor esté funcionando
        print("\n🔌 Verificando conexión con el servidor...")
        response = requests.get("http://localhost:8000/api/trabajos/", timeout=5)
        
        if response.status_code == 200:
            print("✅ Servidor funcionando correctamente")
        else:
            print(f"❌ Error en el servidor: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        print("💡 Asegúrate de que el servidor FastAPI esté ejecutándose")
        return False
    
    # Obtener todos los datos
    print(f"\n📊 Obteniendo datos del servidor...")
    
    try:
        # Obtener trabajos
        response_trabajos = requests.get("http://localhost:8000/api/trabajos/")
        trabajos = response_trabajos.json()
        
        # Obtener gastos del taller
        response_gastos = requests.get("http://localhost:8000/api/gastos-taller/")
        gastos = response_gastos.json()
        
        # Obtener pagos de salarios
        response_salarios = requests.get("http://localhost:8000/api/pagos-salarios/")
        salarios = response_salarios.json()
        
        print(f"✅ Datos obtenidos:")
        print(f"   - Trabajos: {len(trabajos)}")
        print(f"   - Gastos del taller: {len(gastos)}")
        print(f"   - Pagos de salarios: {len(salarios)}")
        
    except Exception as e:
        print(f"❌ Error al obtener datos: {e}")
        return False
    
    # Analizar distribución de datos por mes
    print(f"\n📊 Analizando distribución de datos por mes...")
    
    # Contar trabajos por mes
    trabajos_por_mes = {}
    for trabajo in trabajos:
        fecha = datetime.fromisoformat(trabajo['fecha'].replace('Z', '+00:00'))
        mes_key = f"{fecha.year}-{fecha.month:02d}"
        
        if mes_key not in trabajos_por_mes:
            trabajos_por_mes[mes_key] = {
                'trabajos': [],
                'total_ingresos': 0,
                'total_gastos': 0,
                'total_ganancia': 0
            }
        
        trabajos_por_mes[mes_key]['trabajos'].append(trabajo)
        trabajos_por_mes[mes_key]['total_ingresos'] += trabajo['costo']
        trabajos_por_mes[mes_key]['total_gastos'] += trabajo['total_gastos']
        trabajos_por_mes[mes_key]['total_ganancia'] += trabajo['ganancia']
    
    # Contar gastos por mes
    gastos_por_mes = {}
    for gasto in gastos:
        fecha = datetime.fromisoformat(gasto['fecha_gasto'].replace('Z', '+00:00'))
        mes_key = f"{fecha.year}-{fecha.month:02d}"
        
        if mes_key not in gastos_por_mes:
            gastos_por_mes[mes_key] = 0
        
        gastos_por_mes[mes_key] += gasto['monto']
    
    # Contar salarios por mes
    salarios_por_mes = {}
    for salario in salarios:
        fecha = datetime.fromisoformat(salario['fecha_pago'].replace('Z', '+00:00'))
        mes_key = f"{fecha.year}-{fecha.month:02d}"
        
        if mes_key not in salarios_por_mes:
            salarios_por_mes[mes_key] = 0
        
        salarios_por_mes[mes_key] += salario['monto_salario']
    
    # Mostrar resumen por mes
    print(f"\n📊 Resumen de datos por mes:")
    
    meses_ordenados = sorted(trabajos_por_mes.keys(), reverse=True)
    
    for mes_key in meses_ordenados:
        year, month = mes_key.split('-')
        month_name = datetime(int(year), int(month), 1).strftime('%B')
        
        trabajos_data = trabajos_por_mes[mes_key]
        gastos_data = gastos_por_mes.get(mes_key, 0)
        salarios_data = salarios_por_mes.get(mes_key, 0)
        
        print(f"\n📅 {month_name} {year} ({mes_key}):")
        print(f"   - Trabajos: {len(trabajos_data['trabajos'])}")
        print(f"   - Ingresos: ₡{trabajos_data['total_ingresos']:,.2f}")
        print(f"   - Gastos repuestos: ₡{trabajos_data['total_gastos']:,.2f}")
        print(f"   - Gastos taller: ₡{gastos_data:,.2f}")
        print(f"   - Salarios: ₡{salarios_data:,.2f}")
        print(f"   - Ganancia: ₡{trabajos_data['total_ganancia']:,.2f}")
        
        # Verificar si es el mes actual
        if int(year) == current_year and int(month) == current_month:
            print(f"   - ✅ MES ACTUAL")
        elif int(year) == current_year and int(month) == current_month - 1:
            print(f"   - 📚 MES ANTERIOR")
    
    # Verificar datos del mes actual
    current_month_key = f"{current_year}-{current_month:02d}"
    print(f"\n🎯 Verificando datos del mes actual ({current_month_key}):")
    
    if current_month_key in trabajos_por_mes:
        trabajos_actual = trabajos_por_mes[current_month_key]
        gastos_actual = gastos_por_mes.get(current_month_key, 0)
        salarios_actual = salarios_por_mes.get(current_month_key, 0)
        
        print(f"✅ Hay datos del mes actual:")
        print(f"   - Trabajos: {len(trabajos_actual['trabajos'])}")
        print(f"   - Ingresos: ₡{trabajos_actual['total_ingresos']:,.2f}")
        print(f"   - Gastos repuestos: ₡{trabajos_actual['total_gastos']:,.2f}")
        print(f"   - Gastos taller: ₡{gastos_actual:,.2f}")
        print(f"   - Salarios: ₡{salarios_actual:,.2f}")
        print(f"   - Ganancia: ₡{trabajos_actual['total_ganancia']:,.2f}")
    else:
        print(f"ℹ️ No hay datos del mes actual")
    
    # Verificar datos del mes anterior
    if current_month == 1:
        previous_month = 12
        previous_year = current_year - 1
    else:
        previous_month = current_month - 1
        previous_year = current_year
    
    previous_month_key = f"{previous_year}-{previous_month:02d}"
    print(f"\n📚 Verificando datos del mes anterior ({previous_month_key}):")
    
    if previous_month_key in trabajos_por_mes:
        trabajos_anterior = trabajos_por_mes[previous_month_key]
        gastos_anterior = gastos_por_mes.get(previous_month_key, 0)
        salarios_anterior = salarios_por_mes.get(previous_month_key, 0)
        
        print(f"✅ Hay datos del mes anterior:")
        print(f"   - Trabajos: {len(trabajos_anterior['trabajos'])}")
        print(f"   - Ingresos: ₡{trabajos_anterior['total_ingresos']:,.2f}")
        print(f"   - Gastos repuestos: ₡{trabajos_anterior['total_gastos']:,.2f}")
        print(f"   - Gastos taller: ₡{gastos_anterior:,.2f}")
        print(f"   - Salarios: ₡{salarios_anterior:,.2f}")
        print(f"   - Ganancia: ₡{trabajos_anterior['total_ganancia']:,.2f}")
    else:
        print(f"ℹ️ No hay datos del mes anterior")
    
    # Simular la lógica del frontend
    print(f"\n🔧 Simulando lógica del frontend...")
    
    # Simular la función generateMonthlyReports
    monthly_map = {}
    
    for trabajo in trabajos:
        fecha = datetime.fromisoformat(trabajo['fecha'].replace('Z', '+00:00'))
        month_key = f"{fecha.year}-{fecha.month:02d}"
        month_name = fecha.strftime('%B').capitalize()
        
        if month_key not in monthly_map:
            monthly_map[month_key] = {
                'month': month_name,
                'year': fecha.year,
                'totalIncome': 0,
                'totalExpenses': 0,
                'netProfit': 0,
                'gastosTaller': 0,
                'salarios': 0,
            }
        
        monthly_map[month_key]['totalIncome'] += trabajo['costo']
        monthly_map[month_key]['totalExpenses'] += trabajo['total_gastos']
        monthly_map[month_key]['netProfit'] += trabajo['ganancia']
    
    # Agregar gastos del taller
    for gasto in gastos:
        fecha = datetime.fromisoformat(gasto['fecha_gasto'].replace('Z', '+00:00'))
        month_key = f"{fecha.year}-{fecha.month:02d}"
        
        if month_key in monthly_map:
            monthly_map[month_key]['gastosTaller'] += gasto['monto']
    
    # Agregar salarios
    for salario in salarios:
        fecha = datetime.fromisoformat(salario['fecha_pago'].replace('Z', '+00:00'))
        month_key = f"{fecha.year}-{fecha.month:02d}"
        
        if month_key in monthly_map:
            monthly_map[month_key]['salarios'] += salario['monto_salario']
    
    # Ordenar por fecha (más reciente primero)
    monthly_reports = list(monthly_map.values())
    monthly_reports.sort(key=lambda x: (x['year'], x['month']), reverse=True)
    
    print(f"📊 Reportes mensuales generados ({len(monthly_reports)} reportes):")
    for report in monthly_reports:
        print(f"   - {report['month']} {report['year']}: ₡{report['totalIncome']:,.2f} ingresos, ₡{report['netProfit']:,.2f} ganancia")
    
    # Verificar qué reporte se seleccionaría como currentReport
    if monthly_reports:
        first_report = monthly_reports[0]
        print(f"\n🔍 Primer reporte (currentReport): {first_report['month']} {first_report['year']}")
        print(f"   - Ingresos: ₡{first_report['totalIncome']:,.2f}")
        print(f"   - Gastos: ₡{first_report['totalExpenses']:,.2f}")
        print(f"   - Ganancia: ₡{first_report['netProfit']:,.2f}")
        
        # Verificar si coincide con el mes actual
        if first_report['year'] == current_year and first_report['month'].lower() == now.strftime('%B').lower():
            print(f"   ✅ Coincide con el mes actual")
        else:
            print(f"   ❌ NO coincide con el mes actual")
            print(f"   💡 El frontend debería mostrar datos de {first_report['month']} {first_report['year']} en lugar de {now.strftime('%B')} {current_year}")
    
    print(f"\n✅ Análisis completado")
    return True

def main():
    """Función principal"""
    print("🚀 Iniciando análisis de filtrado de datos por mes...")
    print("=" * 60)
    
    success = test_data_filtering_by_month()
    
    print("=" * 60)
    if success:
        print("✅ Análisis completado exitosamente")
        print("💡 Revisa los resultados para identificar el problema de filtrado")
    else:
        print("❌ El análisis falló")
        print("💡 Revisa los errores anteriores")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
