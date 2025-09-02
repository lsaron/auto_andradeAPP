#!/usr/bin/env python3
"""
Script para verificar todos los datos y identificar el problema
"""

import requests
from datetime import datetime

def test_all_data():
    print("🔍 Verificando todos los datos...")
    
    try:
        # Obtener todos los datos
        response_trabajos = requests.get("http://localhost:8000/api/trabajos/")
        response_gastos = requests.get("http://localhost:8000/api/gastos-taller/")
        response_salarios = requests.get("http://localhost:8000/api/pagos-salarios/")
        
        trabajos = response_trabajos.json()
        gastos = response_gastos.json()
        salarios = response_salarios.json()
        
        print(f"📊 Total de trabajos: {len(trabajos)}")
        print(f"💰 Total de gastos: {len(gastos)}")
        print(f"💵 Total de salarios: {len(salarios)}")
        
        # Analizar trabajos por mes
        print(f"\n📊 Trabajos por mes:")
        trabajos_por_mes = {}
        for trabajo in trabajos:
            fecha = datetime.fromisoformat(trabajo['fecha'].replace('Z', '+00:00'))
            mes_key = f"{fecha.year}-{fecha.month:02d}"
            if mes_key not in trabajos_por_mes:
                trabajos_por_mes[mes_key] = []
            trabajos_por_mes[mes_key].append(trabajo)
        
        for mes_key in sorted(trabajos_por_mes.keys()):
            print(f"   {mes_key}: {len(trabajos_por_mes[mes_key])} trabajos")
        
        # Analizar gastos por mes
        print(f"\n💰 Gastos por mes:")
        gastos_por_mes = {}
        for gasto in gastos:
            fecha = datetime.fromisoformat(gasto['fecha_gasto'].replace('Z', '+00:00'))
            mes_key = f"{fecha.year}-{fecha.month:02d}"
            if mes_key not in gastos_por_mes:
                gastos_por_mes[mes_key] = []
            gastos_por_mes[mes_key].append(gasto)
        
        for mes_key in sorted(gastos_por_mes.keys()):
            print(f"   {mes_key}: {len(gastos_por_mes[mes_key])} gastos")
        
        # Analizar salarios por mes
        print(f"\n💵 Salarios por mes:")
        salarios_por_mes = {}
        for salario in salarios:
            fecha = datetime.fromisoformat(salario['fecha_pago'].replace('Z', '+00:00'))
            mes_key = f"{fecha.year}-{fecha.month:02d}"
            if mes_key not in salarios_por_mes:
                salarios_por_mes[mes_key] = []
            salarios_por_mes[mes_key].append(salario)
        
        for mes_key in sorted(salarios_por_mes.keys()):
            print(f"   {mes_key}: {len(salarios_por_mes[mes_key])} salarios")
        
        # Simular la lógica del frontend
        print(f"\n🔧 Simulando lógica del frontend...")
        
        # Simular generateMonthlyReports
        monthly_map = {}
        
        # Procesar trabajos
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
        
        # Procesar gastos
        for gasto in gastos:
            fecha = datetime.fromisoformat(gasto['fecha_gasto'].replace('Z', '+00:00'))
            month_key = f"{fecha.year}-{fecha.month:02d}"
            
            if month_key in monthly_map:
                monthly_map[month_key]['gastosTaller'] += gasto['monto']
        
        # Procesar salarios
        for salario in salarios:
            fecha = datetime.fromisoformat(salario['fecha_pago'].replace('Z', '+00:00'))
            month_key = f"{fecha.year}-{fecha.month:02d}"
            
            if month_key in monthly_map:
                monthly_map[month_key]['salarios'] += salario['monto_salario']
        
        # Ordenar por fecha
        monthly_reports = list(monthly_map.values())
        monthly_reports.sort(key=lambda x: (x['year'], x['month']), reverse=True)
        
        print(f"📊 Reportes generados:")
        for report in monthly_reports:
            print(f"   {report['month']} {report['year']}: Ingresos=${report['totalIncome']:,.2f}, Gastos=${report['totalExpenses']:,.2f}, Ganancia=${report['netProfit']:,.2f}")
        
        # Verificar qué reporte se seleccionaría
        if monthly_reports:
            first_report = monthly_reports[0]
            print(f"\n🔍 Primer reporte (currentReport): {first_report['month']} {first_report['year']}")
            print(f"   - Ingresos: ${first_report['totalIncome']:,.2f}")
            print(f"   - Gastos: ${first_report['totalExpenses']:,.2f}")
            print(f"   - Ganancia: ${first_report['netProfit']:,.2f}")
            
            # Verificar si coincide con septiembre
            current_month = datetime.now().month
            current_year = datetime.now().year
            
            if first_report['year'] == current_year and first_report['month'].lower() == 'septiembre':
                print(f"   ✅ Coincide con el mes actual (Septiembre)")
            else:
                print(f"   ❌ NO coincide con el mes actual")
                print(f"   💡 Debería mostrar {first_report['month']} {first_report['year']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_all_data()
