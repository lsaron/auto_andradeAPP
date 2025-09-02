#!/usr/bin/env python3
"""
Script para simular exactamente la inicialización del componente React reports-section
"""
import requests
import json
from datetime import datetime

def simulate_react_initialization():
    print("🔍 SIMULANDO INICIALIZACIÓN DEL COMPONENTE REACT...")
    print("=" * 80)
    
    try:
        # Simular el estado inicial del componente
        print("🚀 PASO 1: Estado inicial del componente...")
        
        # Estados iniciales (como en React)
        selected_year = ""
        selected_month = ""
        monthly_reports = []
        work_orders_report = []
        loading = True
        error = None
        current_report = None
        previous_report = None
        is_current_period = True
        last_updated = None
        
        print(f"   📊 Estados iniciales:")
        print(f"      - selectedYear: '{selected_year}'")
        print(f"      - selectedMonth: '{selected_month}'")
        print(f"      - monthlyReports: {len(monthly_reports)} elementos")
        print(f"      - workOrdersReport: {len(work_orders_report)} elementos")
        print(f"      - loading: {loading}")
        print(f"      - error: {error}")
        print(f"      - currentReport: {current_report}")
        print(f"      - previousReport: {previous_report}")
        print(f"      - isCurrentPeriod: {is_current_period}")
        print(f"      - lastUpdated: {last_updated}")
        
        print()
        
        # Simular useEffect inicial (al montar el componente)
        print("🔄 PASO 2: Simulando useEffect inicial (al montar)...")
        
        # Este useEffect se ejecuta al montar el componente
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        default_month = f"{current_year}-{str(current_month).zfill(2)}"
        
        print(f"   📅 useEffect inicial ejecutado:")
        print(f"      - Fecha actual: {now.strftime('%Y-%m-%d')}")
        print(f"      - Año actual: {current_year}")
        print(f"      - Mes actual: {current_month}")
        print(f"      - defaultMonth: {default_month}")
        
        # Actualizar estados
        selected_year = str(current_year)
        selected_month = default_month
        
        print(f"   🔄 Estados actualizados después del useEffect inicial:")
        print(f"      - selectedYear: '{selected_year}'")
        print(f"      - selectedMonth: '{selected_month}'")
        
        print()
        
        # Simular loadReportsData() (llamada desde useEffect)
        print("📊 PASO 3: Simulando loadReportsData()...")
        
        # Obtener datos del backend
        response = requests.get("http://localhost:8000/api/trabajos/")
        if response.status_code == 200:
            trabajos = response.json()
            print(f"   ✅ Trabajos obtenidos: {len(trabajos)}")
        else:
            print(f"   ❌ Error en trabajos: {response.status_code}")
            return
        
        response_gastos = requests.get("http://localhost:8000/api/gastos-taller/")
        if response_gastos.status_code == 200:
            gastos_taller = response_gastos.json()
            print(f"   ✅ Gastos del taller obtenidos: {len(gastos_taller)}")
        else:
            print(f"   ❌ Error en gastos: {response_gastos.status_code}")
            return
        
        response_salarios = requests.get("http://localhost:8000/api/pagos-salarios/")
        if response_salarios.status_code == 200:
            pagos_salarios = response_salarios.json()
            print(f"   ✅ Pagos de salarios obtenidos: {len(pagos_salarios)}")
        else:
            print(f"   ❌ Error en salarios: {response_salarios.status_code}")
            return
        
        print()
        
        # Simular la transformación de datos
        print("🔄 PASO 4: Simulando transformación de datos...")
        
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
            print(f"   🔄 Trabajo {transformed['id']}: {transformed['date']} -> {transformed['description']}")
        
        # Actualizar estado
        work_orders_report = transformed_work_orders
        
        print(f"   ✅ workOrdersReport actualizado: {len(work_orders_report)} elementos")
        print()
        
        # Simular generateMonthlyReports
        print("📊 PASO 5: Simulando generateMonthlyReports...")
        
        monthly_map = {}
        month_names = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        
        # Procesar trabajos
        for order in work_orders_report:
            date = datetime.fromisoformat(order['date'].replace('Z', '+00:00'))
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            month_name = month_names[date.month - 1]
            
            print(f"   📊 Trabajo: {order['date']} -> Mes: {date.month} -> Key: {month_key} -> Nombre: {month_name}")
            
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
                print(f"   📊 Nuevo mes creado: {month_key} ({month_name})")
            
            month_data = monthly_map[month_key]
            month_data['totalIncome'] += order['income']
            month_data['totalExpenses'] += order['expenses']
            month_data['netProfit'] += order['profit']
            
            print(f"   📊 Actualizado {month_key}: Ingresos={month_data['totalIncome']}, Gastos={month_data['totalExpenses']}, Ganancia={month_data['netProfit']}")
        
        # Procesar gastos del taller
        for gasto in gastos_taller:
            date = datetime.fromisoformat(gasto['fecha_gasto'].replace('Z', '+00:00'))
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            
            if month_key in monthly_map:
                month_data = monthly_map[month_key]
                monto = float(gasto['monto']) if gasto['monto'] else 0
                month_data['gastosTaller'] += monto
                print(f"   💰 Gasto {month_key}: {monto} -> Total: {month_data['gastosTaller']}")
        
        # Procesar pagos de salarios
        for pago in pagos_salarios:
            date = datetime.fromisoformat(pago['fecha_pago'].replace('Z', '+00:00'))
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            
            if month_key in monthly_map:
                month_data = monthly_map[month_key]
                monto = float(pago['monto_salario']) if pago['monto_salario'] else 0
                month_data['salarios'] += monto
                print(f"   💵 Salario {month_key}: {monto} -> Total: {month_data['salarios']}")
        
        # Ordenar reportes
        monthly_reports = list(monthly_map.values())
        monthly_reports.sort(key=lambda x: (x['year'], x['month']), reverse=True)
        
        print(f"\n   📊 Reportes mensuales generados: {len(monthly_reports)}")
        for report in monthly_reports:
            print(f"   📊 {report['month']} {report['year']}: Ingresos={report['totalIncome']}, Gastos={report['totalExpenses']}, Ganancia={report['netProfit']}")
        
        # Actualizar estado
        monthly_reports = monthly_reports
        
        print(f"   ✅ monthlyReports actualizado: {len(monthly_reports)} elementos")
        print()
        
        # Simular la lógica de establecer reportes
        print("🎯 PASO 6: Simulando establecimiento de reportes...")
        
        # Buscar reporte del mes actual
        current_month_key = f"{current_year}-{str(current_month).zfill(2)}"
        print(f"   📅 Buscando reporte del mes actual: {current_month_key}")
        print(f"   📅 Reportes disponibles: {[f'{r['month']} {r['year']}' for r in monthly_reports]}")
        
        # Buscar el reporte del mes actual en los datos generados
        current_month_report = None
        for report in monthly_reports:
            report_month_key = f"{report['year']}-{str(month_names.index(report['month']) + 1).zfill(2)}"
            print(f"   🔍 Comparando: {report_month_key} vs {current_month_key} ({report['month']} {report['year']})")
            if report_month_key == current_month_key:
                current_month_report = report
                break
        
        # Si no hay datos del mes actual, usar el reporte más reciente disponible
        fallback_report = current_month_report or (monthly_reports[0] if monthly_reports else None)
        
        # Buscar el reporte del mes anterior para comparación
        previous_month = current_month if current_month > 1 else 12
        previous_year = current_year if current_month > 1 else current_year - 1
        previous_month_key = f"{previous_year}-{str(previous_month).zfill(2)}"
        
        previous_month_report = None
        for report in monthly_reports:
            report_month_key = f"{report['year']}-{str(month_names.index(report['month']) + 1).zfill(2)}"
            if report_month_key == previous_month_key:
                previous_month_report = report
                break
        
        print(f"   🔍 Estableciendo reportes:")
        print(f"      - currentMonthKey: {current_month_key}")
        print(f"      - currentMonthReport: {current_month_report['month'] + ' ' + str(current_month_report['year']) if current_month_report else 'No encontrado'}")
        print(f"      - fallbackReport: {fallback_report['month'] + ' ' + str(fallback_report['year']) if fallback_report else 'No disponible'}")
        print(f"      - previousMonthKey: {previous_month_key}")
        print(f"      - previousMonthReport: {previous_month_report['month'] + ' ' + str(previous_month_report['year']) if previous_month_report else 'No encontrado'}")
        
        # Actualizar estados
        current_report = fallback_report
        previous_report = previous_month_report
        
        print(f"   ✅ Estados finales:")
        print(f"      - currentReport: {current_report['month'] + ' ' + str(current_report['year']) if current_report else 'None'}")
        print(f"      - previousReport: {previous_month_report['month'] + ' ' + str(previous_month_report['year']) if previous_month_report else 'None'}")
        
        print()
        
        # Simular el renderizado final
        print("🎨 PASO 7: Simulando renderizado final...")
        
        if not current_report or len(monthly_reports) == 0:
            print("   ❌ RENDERIZADO: No hay datos disponibles")
            print("      - currentReport:", current_report)
            print("      - monthlyReports:", len(monthly_reports))
        else:
            print("   ✅ RENDERIZADO: Datos disponibles")
            print(f"      - Mes seleccionado: {selected_month}")
            print(f"      - Año seleccionado: {selected_year}")
            print(f"      - Reporte actual: {current_report['month']} {current_report['year']}")
            print(f"      - Ingresos: {current_report['totalIncome']}")
            print(f"      - Gastos: {current_report['totalExpenses']}")
            print(f"      - Ganancia: {current_report['netProfit']}")
            print(f"      - Gastos del taller: {current_report['gastosTaller']}")
            print(f"      - Salarios: {current_report['salarios']}")
        
        print()
        
        # Verificar si hay algún problema
        print("🔍 PASO 8: Análisis de posibles problemas...")
        
        # Verificar que los datos no sean 0
        if current_report:
            if (current_report['totalIncome'] == 0 and 
                current_report['totalExpenses'] == 0 and 
                current_report['netProfit'] == 0):
                print("   ⚠️  PROBLEMA DETECTADO: Todos los valores del reporte son 0")
                print("      Esto podría indicar datos mock o un error en el procesamiento")
            else:
                print("   ✅ Los valores del reporte no son todos 0")
        
        # Verificar que monthlyReports no esté vacío
        if len(monthly_reports) == 0:
            print("   ⚠️  PROBLEMA DETECTADO: monthlyReports está vacío")
        else:
            print("   ✅ monthlyReports tiene datos")
        
        # Verificar que workOrdersReport no esté vacío
        if len(work_orders_report) == 0:
            print("   ⚠️  PROBLEMA DETECTADO: workOrdersReport está vacío")
        else:
            print("   ✅ workOrdersReport tiene datos")
        
        print("\n🎉 SIMULACIÓN COMPLETADA!")
        
    except Exception as e:
        print(f"❌ Error durante la simulación: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    simulate_react_initialization()
