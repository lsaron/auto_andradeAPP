#!/usr/bin/env python3
"""
Script para simular exactamente lo que hace el reports-section
"""

import requests
import json
from datetime import datetime

def simulate_reports_section():
    print("🔧 Simulando reports-section...")
    print("=" * 60)
    
    try:
        # 1. Cargar datos como lo hace loadReportsData()
        print("📊 Cargando datos del backend...")
        
        # Obtener trabajos
        response = requests.get("http://localhost:8000/api/trabajos/")
        if not response.ok:
            raise Exception("Error al cargar trabajos")
        trabajos = response.json()
        print(f"✅ Trabajos cargados: {len(trabajos)}")
        
        # Obtener gastos del taller
        response = requests.get("http://localhost:8000/api/gastos-taller/")
        if not response.ok:
            raise Exception("Error al cargar gastos del taller")
        gastos_taller = response.json()
        print(f"✅ Gastos del taller cargados: {len(gastos_taller)}")
        
        # Obtener pagos de salarios
        response = requests.get("http://localhost:8000/api/pagos-salarios/")
        if not response.ok:
            raise Exception("Error al cargar pagos de salarios")
        pagos_salarios = response.json()
        print(f"✅ Pagos de salarios cargados: {len(pagos_salarios)}")
        
        # 2. Transformar trabajos como lo hace el frontend
        print("\n🔄 Transformando trabajos...")
        transformed_work_orders = []
        
        for trabajo in trabajos:
            transformed_work_order = {
                "id": f"WO-{str(trabajo['id']).zfill(3)}",
                "date": trabajo['fecha'],
                "licensePlate": trabajo['matricula_carro'],
                "clientName": trabajo['cliente_nombre'],
                "description": trabajo['descripcion'],
                "income": trabajo['costo'],
                "expenses": trabajo['total_gastos'],
                "profit": trabajo['ganancia'],
                "manoObra": trabajo['mano_obra'] or 0,
                "comision": trabajo.get('comision', 0),
                "mechanicId": trabajo['mecanicos_ids'][0] if trabajo['mecanicos_ids'] else None,
                "mecanicosIds": trabajo['mecanicos_ids'],
                "mecanicosNombres": trabajo['mecanicos_nombres'],
                "totalMecanicos": trabajo['total_mecanicos']
            }
            transformed_work_orders.append(transformed_work_order)
            print(f"   - Trabajo {transformed_work_order['id']}: {transformed_work_order['date']} -> {transformed_work_order['description']}")
        
        # 3. Generar reportes mensuales como lo hace generateMonthlyReports()
        print("\n📊 Generando reportes mensuales...")
        monthly_map = {}
        
        # Procesar trabajos
        for order in transformed_work_orders:
            date = datetime.strptime(order['date'], '%Y-%m-%d')
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            
            month_names = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ]
            month_name = month_names[date.month - 1]
            
            print(f"   📊 Trabajo: {order['date']} -> {date.strftime('%Y-%m-%d')} -> Mes: {date.month} -> Key: {month_key} -> Nombre: {month_name}")
            
            if month_key not in monthly_map:
                monthly_map[month_key] = {
                    "month": month_name,
                    "year": date.year,
                    "totalIncome": 0,
                    "totalExpenses": 0,
                    "netProfit": 0,
                    "gastosTaller": 0,
                    "salarios": 0,
                }
                print(f"   📊 Nuevo mes creado: {month_key} ({month_name})")
            
            month_data = monthly_map[month_key]
            month_data["totalIncome"] += order["income"]
            month_data["totalExpenses"] += order["expenses"]
            month_data["netProfit"] += order["profit"]
            
            print(f"   📊 Actualizado {month_key}: Ingresos={month_data['totalIncome']}, Gastos={month_data['totalExpenses']}, Ganancia={month_data['netProfit']}")
        
        # Procesar gastos del taller
        print(f"\n💰 Procesando gastos del taller: {len(gastos_taller)}")
        for gasto in gastos_taller:
            date = datetime.strptime(gasto['fecha_gasto'], '%Y-%m-%d')
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            
            print(f"   💰 Gasto: {gasto['fecha_gasto']} -> {date.strftime('%Y-%m-%d')} -> Mes: {date.month} -> Key: {month_key}")
            
            if month_key in monthly_map:
                month_data = monthly_map[month_key]
                monto_gasto = float(gasto['monto']) if gasto['monto'] else 0
                month_data["gastosTaller"] = (month_data["gastosTaller"] or 0) + monto_gasto
                print(f"   💰 Gasto taller {month_key}: {monto_gasto} -> Total: {month_data['gastosTaller']}")
            else:
                print(f"   💰 Gasto {month_key}: No se encontró el mes en monthlyMap")
        
        # Procesar pagos de salarios
        print(f"\n💵 Procesando pagos de salarios: {len(pagos_salarios)}")
        for pago in pagos_salarios:
            date = datetime.strptime(pago['fecha_pago'], '%Y-%m-%d')
            month_key = f"{date.year}-{str(date.month).zfill(2)}"
            
            print(f"   💵 Pago: {pago['fecha_pago']} -> {date.strftime('%Y-%m-%d')} -> Mes: {date.month} -> Key: {month_key}")
            
            if month_key in monthly_map:
                month_data = monthly_map[month_key]
                monto_salario = float(pago['monto_salario']) if pago['monto_salario'] else 0
                month_data["salarios"] = (month_data["salarios"] or 0) + monto_salario
                print(f"   💵 Salario {month_key}: {monto_salario} -> Total: {month_data['salarios']}")
            else:
                print(f"   💵 Pago {month_key}: No se encontró el mes en monthlyMap")
        
        # 4. Ordenar reportes por fecha (más reciente primero)
        monthly_reports = list(monthly_map.values())
        monthly_reports.sort(key=lambda x: (x['year'], ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].index(x['month'])), reverse=True)
        
        print(f"\n📊 Reportes mensuales generados: {len(monthly_reports)}")
        print("📊 Resumen de reportes:")
        for i, report in enumerate(monthly_reports):
            print(f"   {i + 1}. {report['month']} {report['year']}: Ingresos={report['totalIncome']}, Gastos={report['totalExpenses']}, Ganancia={report['netProfit']}")
        
        # 5. Establecer reporte del mes actual
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        current_month_key = f"{current_year}-{str(current_month).zfill(2)}"
        
        print(f"\n🔍 Buscando reporte del mes actual: {current_month_key}")
        print(f"🔍 Reportes disponibles: {[f'{r['month']} {r['year']}' for r in monthly_reports]}")
        
        # Buscar el reporte del mes actual
        current_month_report = None
        for report in monthly_reports:
            report_month_key = f"{report['year']}-{str(['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].index(report['month']) + 1).zfill(2)}"
            print(f"   🔍 Comparando: {report_month_key} vs {current_month_key} ({report['month']} {report['year']})")
            if report_month_key == current_month_key:
                current_month_report = report
                break
        
        # Si no hay datos del mes actual, usar el reporte más reciente disponible
        fallback_report = current_month_report or (monthly_reports[0] if monthly_reports else None)
        
        print(f"\n🔍 Estableciendo reportes:")
        print(f"   - currentMonthKey: {current_month_key}")
        print(f"   - currentMonthReport: {f'{current_month_report['month']} {current_month_report['year']}' if current_month_report else 'No encontrado'}")
        print(f"   - fallbackReport: {f'{fallback_report['month']} {fallback_report['year']}' if fallback_report else 'No disponible'}")
        
        # 6. Resultado final
        if fallback_report:
            print(f"\n🎯 Reporte actual establecido:")
            print(f"   - Mes: {fallback_report['month']} {fallback_report['year']}")
            print(f"   - Ingresos totales: {fallback_report['totalIncome']}")
            print(f"   - Gastos totales: {fallback_report['totalExpenses']}")
            print(f"   - Ganancia neta: {fallback_report['netProfit']}")
            print(f"   - Gastos del taller: {fallback_report['gastosTaller']}")
            print(f"   - Salarios: {fallback_report['salarios']}")
        else:
            print(f"\n❌ No hay reportes disponibles")
        
    except Exception as e:
        print(f"❌ Error en la simulación: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    simulate_reports_section()
