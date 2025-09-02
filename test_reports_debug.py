#!/usr/bin/env python3
"""
Script para debuggear exactamente qué está pasando en el reports-section
"""
import requests
import json
from datetime import datetime

def debug_reports_section():
    print("🔍 DEBUGGING REPORTS-SECTION PASO A PASO...")
    print("=" * 80)
    
    try:
        # 1. Obtener datos del backend
        print("📊 PASO 1: Obteniendo datos del backend...")
        
        # Trabajos
        response = requests.get("http://localhost:8000/api/trabajos/")
        if response.status_code == 200:
            trabajos = response.json()
            print(f"   ✅ Trabajos: {len(trabajos)} registros")
            if trabajos:
                print(f"   🔍 Primer trabajo: ID={trabajos[0].get('id')}, Fecha={trabajos[0].get('fecha')}")
                print(f"   🔍 Campos disponibles: {list(trabajos[0].keys())}")
        else:
            print(f"   ❌ Error en trabajos: {response.status_code}")
            return
        
        # Gastos del taller
        response = requests.get("http://localhost:8000/api/gastos-taller/")
        if response.status_code == 200:
            gastos = response.json()
            print(f"   ✅ Gastos del taller: {len(gastos)} registros")
        else:
            print(f"   ❌ Error en gastos: {response.status_code}")
            return
        
        # Pagos de salarios
        response = requests.get("http://localhost:8000/api/pagos-salarios/")
        if response.status_code == 200:
            pagos = response.json()
            print(f"   ✅ Pagos de salarios: {len(pagos)} registros")
        else:
            print(f"   ❌ Error en pagos: {response.status_code}")
            return
        
        print()
        
        # 2. Simular la transformación del frontend
        print("🔄 PASO 2: Simulando transformación del frontend...")
        
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
        
        print(f"   ✅ Total trabajos transformados: {len(transformed_work_orders)}")
        print()
        
        # 3. Simular generateMonthlyReports
        print("📊 PASO 3: Simulando generateMonthlyReports...")
        
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
        print(f"   💰 Procesando gastos del taller: {len(gastos)}")
        for gasto in gastos:
            date = datetime.fromisoformat(gasto['fecha_gasto'].replace('Z', '+00:00'))
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            
            if month_key in monthly_map:
                month_data = monthly_map[month_key]
                monto = float(gasto['monto']) if gasto['monto'] else 0
                month_data['gastosTaller'] += monto
                print(f"   💰 Gasto {month_key}: {monto} -> Total: {month_data['gastosTaller']}")
            else:
                print(f"   💰 Gasto {month_key}: No se encontró el mes en monthly_map")
        
        # Procesar pagos de salarios
        print(f"   💵 Procesando pagos de salarios: {len(pagos)}")
        for pago in pagos:
            date = datetime.fromisoformat(pago['fecha_pago'].replace('Z', '+00:00'))
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            
            if month_key in monthly_map:
                month_data = monthly_map[month_key]
                monto = float(pago['monto_salario']) if pago['monto_salario'] else 0
                month_data['salarios'] += monto
                print(f"   💵 Salario {month_key}: {monto} -> Total: {month_data['salarios']}")
            else:
                print(f"   💵 Pago {month_key}: No se encontró el mes en monthly_map")
        
        # Ordenar reportes
        monthly_reports = list(monthly_map.values())
        monthly_reports.sort(key=lambda x: (x['year'], x['month']), reverse=True)
        
        print(f"\n   📊 Reportes mensuales generados: {len(monthly_reports)}")
        for report in monthly_reports:
            print(f"   📊 {report['month']} {report['year']}: Ingresos={report['totalIncome']}, Gastos={report['totalExpenses']}, Ganancia={report['netProfit']}")
        
        print()
        
        # 4. Simular la lógica de selección del mes actual
        print("🎯 PASO 4: Simulando selección del mes actual...")
        
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
        
        if current_month_report:
            print(f"   ✅ Reporte del mes actual encontrado: {current_month_report['month']} {current_month_report['year']}")
            print(f"   📊 Datos: Ingresos={current_month_report['totalIncome']}, Gastos={current_month_report['totalExpenses']}, Ganancia={current_month_report['netProfit']}")
        else:
            print(f"   ❌ No se encontró reporte para el mes actual: {current_month_key}")
            if monthly_reports:
                fallback = monthly_reports[0]
                print(f"   🔄 Usando reporte más reciente como fallback: {fallback['month']} {fallback['year']}")
                print(f"   📊 Datos fallback: Ingresos={fallback['totalIncome']}, Gastos={fallback['totalExpenses']}, Ganancia={fallback['netProfit']}")
        
        print()
        
        # 5. Verificar que no hay datos mock
        print("🔍 PASO 5: Verificando que no hay datos mock...")
        
        mock_detected = False
        for report in monthly_reports:
            if (report['totalIncome'] == 0 and report['totalExpenses'] == 0 and 
                report['netProfit'] == 0 and report['gastosTaller'] == 0 and report['salarios'] == 0):
                print(f"   ⚠️  REPORTE SUSPECHOSO (todo en 0): {report['month']} {report['year']}")
                mock_detected = True
        
        if not mock_detected:
            print("   ✅ No se detectaron reportes con todos los valores en 0")
        
        # Verificar que los datos coinciden con el backend
        print("\n🔍 PASO 6: Verificando consistencia con el backend...")
        
        total_income_backend = sum(trabajo['costo'] for trabajo in trabajos)
        total_expenses_backend = sum(trabajo['total_gastos'] for trabajo in trabajos)
        total_profit_backend = sum(trabajo['ganancia'] for trabajo in trabajos)
        
        print(f"   📊 Backend - Total trabajos: {len(trabajos)}")
        print(f"   📊 Backend - Ingresos totales: {total_income_backend}")
        print(f"   📊 Backend - Gastos totales: {total_expenses_backend}")
        print(f"   📊 Backend - Ganancia total: {total_profit_backend}")
        
        # Verificar que los reportes coinciden
        if monthly_reports:
            total_income_reports = sum(report['totalIncome'] for report in monthly_reports)
            total_expenses_reports = sum(report['totalExpenses'] for report in monthly_reports)
            total_profit_reports = sum(report['netProfit'] for report in monthly_reports)
            
            print(f"   📊 Reportes - Ingresos totales: {total_income_reports}")
            print(f"   📊 Reportes - Gastos totales: {total_expenses_reports}")
            print(f"   📊 Reportes - Ganancia total: {total_profit_reports}")
            
            if (abs(total_income_backend - total_income_reports) < 0.01 and
                abs(total_expenses_backend - total_expenses_reports) < 0.01 and
                abs(total_profit_backend - total_profit_reports) < 0.01):
                print("   ✅ Los datos de los reportes coinciden con el backend")
            else:
                print("   ❌ DISCREPANCIA: Los datos de los reportes NO coinciden con el backend")
                print(f"      Diferencia en ingresos: {total_income_backend - total_income_reports}")
                print(f"      Diferencia en gastos: {total_expenses_backend - total_expenses_reports}")
                print(f"      Diferencia en ganancia: {total_profit_backend - total_profit_reports}")
        
        print("\n🎉 DEBUG COMPLETADO!")
        
    except Exception as e:
        print(f"❌ Error durante el debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_reports_section()

