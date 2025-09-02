#!/usr/bin/env python3
"""
Script simple para probar el componente y ver los logs de debug
"""
import requests
import json

def test_component_debug():
    print("🔍 PROBANDO COMPONENTE CON LOGS DE DEBUG...")
    print("=" * 60)
    
    try:
        # Simular la llamada a loadReportsData
        print("📊 PASO 1: Simulando loadReportsData...")
        
        # Obtener trabajos
        response = requests.get("http://localhost:8000/api/trabajos/")
        if response.status_code == 200:
            trabajos = response.json()
            print(f"   ✅ Trabajos obtenidos: {len(trabajos)}")
        else:
            print(f"   ❌ Error en trabajos: {response.status_code}")
            return
        
        # Obtener gastos del taller
        response = requests.get("http://localhost:8000/api/gastos-taller/")
        if response.status_code == 200:
            gastos = response.json()
            print(f"   ✅ Gastos del taller obtenidos: {len(gastos)}")
        else:
            print(f"   ❌ Error en gastos: {response.status_code}")
            return
        
        # Obtener pagos de salarios
        response = requests.get("http://localhost:8000/api/pagos-salarios/")
        if response.status_code == 200:
            pagos = response.json()
            print(f"   ✅ Pagos de salarios obtenidos: {len(pagos)}")
        else:
            print(f"   ❌ Error en pagos: {response.status_code}")
            return
        
        print()
        
        # Simular la transformación
        print("🔄 PASO 2: Simulando transformación...")
        
        transformed_work_orders = []
        for trabajo in trabajos:
            transformed = {
                'id': f"WO-{str(trabajo['id']).zfill(3)}",
                'date': trabajo['fecha'],
                'licensePlate': trabajo['matricula_carro'],
                'clientName': trabajo['cliente_nombre'],
                'description': trabajo['descripcion'],
                'income': trabajo['costo'],
                'expenses': trabajo['total_gastos'],
                'profit': trabajo['ganancia'],
                'manoObra': trabajo.get('mano_obra', 0),
                'comision': trabajo.get('comision', trabajo.get('comision_mecanico', 0)),
                'mechanicId': trabajo.get('mecanicos_ids', [])[0] if trabajo.get('mecanicos_ids') else None,
                'mecanicosIds': trabajo.get('mecanicos_ids', []),
                'mecanicosNombres': trabajo.get('mecanicos_nombres', []),
                'totalMecanicos': trabajo.get('total_mecanicos', 0)
            }
            transformed_work_orders.append(transformed)
        
        print(f"   ✅ Trabajos transformados: {len(transformed_work_orders)}")
        print()
        
        # Simular generateMonthlyReports
        print("📊 PASO 3: Simulando generateMonthlyReports...")
        
        from datetime import datetime
        
        monthly_map = {}
        month_names = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        
        # Procesar trabajos
        for order in transformed_work_orders:
            date = datetime.fromisoformat(order['date'].replace('Z', '+00:00'))
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            month_name = month_names[date.month - 1]
            
            if month_key not in monthly_map:
                monthly_map[month_key] = {
                    'month': month_name,
                    'year': date.year,
                    'totalIncome': 0,
                    'totalExpenses': 0,
                    'netProfit': 0,
                    'gastosTaller': 0,
                    'salarios': 0
                }
            
            month_data = monthly_map[month_key]
            month_data['totalIncome'] += order['income']
            month_data['totalExpenses'] += order['expenses']
            month_data['netProfit'] += order['profit']
        
        # Procesar gastos del taller
        for gasto in gastos:
            date = datetime.fromisoformat(gasto['fecha_gasto'].replace('Z', '+00:00'))
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            
            if month_key in monthly_map:
                month_data = monthly_map[month_key]
                monto = float(gasto['monto']) if gasto['monto'] else 0
                month_data['gastosTaller'] += monto
        
        # Procesar pagos de salarios
        for pago in pagos:
            date = datetime.fromisoformat(pago['fecha_pago'].replace('Z', '+00:00'))
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            
            if month_key in monthly_map:
                month_data = monthly_map[month_key]
                monto = float(pago['monto_salario']) if pago['monto_salario'] else 0
                month_data['salarios'] += monto
        
        # Ordenar reportes
        monthly_reports = list(monthly_map.values())
        monthly_reports.sort(key=lambda x: (x['year'], x['month']), reverse=True)
        
        print(f"   ✅ Reportes mensuales generados: {len(monthly_reports)}")
        for report in monthly_reports:
            print(f"   📊 {report['month']} {report['year']}: Ingresos={report['totalIncome']}, Gastos={report['totalExpenses']}, Ganancia={report['netProfit']}")
        
        print()
        
        # Simular la lógica de establecimiento de reportes
        print("🎯 PASO 4: Simulando establecimiento de reportes...")
        
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        current_month_key = f"{current_year}-{str(current_month).zfill(2)}"
        
        print(f"   📅 Fecha actual: {now.strftime('%Y-%m-%d')}")
        print(f"   📅 Año actual: {current_year}")
        print(f"   📅 Mes actual: {current_month}")
        print(f"   📅 Key del mes actual: {current_month_key}")
        
        # Buscar reporte del mes actual
        current_month_report = None
        for report in monthly_reports:
            report_month_key = f"{report['year']}-{str(month_names.index(report['month']) + 1).zfill(2)}"
            if report_month_key == current_month_key:
                current_month_report = report
                break
        
        print(f"   🔍 currentMonthReport: {current_month_report['month'] + ' ' + str(current_month_report['year']) if current_month_report else 'No encontrado'}")
        
        # Si no hay datos del mes actual, usar el reporte más reciente disponible
        fallback_report = current_month_report or (monthly_reports[0] if monthly_reports else None)
        
        print(f"   🔍 fallbackReport: {fallback_report['month'] + ' ' + str(fallback_report['year']) if fallback_report else 'No disponible'}")
        
        # Verificar que fallbackReport no sea null
        if fallback_report is None:
            print("   ❌ PROBLEMA: fallbackReport es null")
            print("      - monthly_reports.length:", len(monthly_reports))
            if len(monthly_reports) > 0:
                print("      - Primer reporte:", monthly_reports[0])
        else:
            print("   ✅ fallbackReport no es null")
        
        print()
        
        # Simular el renderizado condicional
        print("🎨 PASO 5: Simulando renderizado condicional...")
        
        # Simular los estados del componente
        current_report = fallback_report
        monthly_reports_state = monthly_reports
        
        print(f"   📊 Estados del componente:")
        print(f"      - currentReport: {current_report['month'] + ' ' + str(current_report['year']) if current_report else 'None'}")
        print(f"      - monthlyReports.length: {len(monthly_reports_state)}")
        
        # Verificar la condición del renderizado
        if not current_report or len(monthly_reports_state) == 0:
            print("   ❌ RENDERIZADO: Mostrando 'No hay datos disponibles'")
            print("      - !currentReport:", not current_report)
            print("      - monthlyReports.length === 0:", len(monthly_reports_state) == 0)
        else:
            print("   ✅ RENDERIZADO: Mostrando datos")
            print(f"      - Mes: {current_report['month']} {current_report['year']}")
            print(f"      - Ingresos: {current_report['totalIncome']}")
            print(f"      - Gastos: {current_report['totalExpenses']}")
            print(f"      - Ganancia: {current_report['netProfit']}")
        
        print("\n🎉 PRUEBA COMPLETADA!")
        
    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_component_debug()

