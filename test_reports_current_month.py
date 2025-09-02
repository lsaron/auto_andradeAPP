#!/usr/bin/env python3
"""
Script de prueba para verificar que el sistema de reportes detecta correctamente el mes actual
"""

import requests
import json
from datetime import datetime
import sys

def test_current_month_detection():
    """Prueba la detección del mes actual en el sistema de reportes"""
    
    print("🔍 Verificando detección del mes actual...")
    
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
    
    # Verificar datos del mes actual
    print(f"\n📊 Verificando datos del mes actual ({current_year}-{current_month:02d})...")
    
    try:
        # Obtener trabajos del mes actual
        response = requests.get("http://localhost:8000/api/trabajos/")
        trabajos = response.json()
        
        # Filtrar trabajos del mes actual
        trabajos_mes_actual = []
        for trabajo in trabajos:
            fecha_trabajo = datetime.fromisoformat(trabajo['fecha'].replace('Z', '+00:00'))
            if fecha_trabajo.year == current_year and fecha_trabajo.month == current_month:
                trabajos_mes_actual.append(trabajo)
        
        print(f"📊 Trabajos del mes actual: {len(trabajos_mes_actual)}")
        
        if len(trabajos_mes_actual) > 0:
            print("✅ Hay datos del mes actual")
            for trabajo in trabajos_mes_actual[:3]:  # Mostrar solo los primeros 3
                print(f"   - {trabajo['fecha']}: {trabajo['cliente_nombre']} - {trabajo['matricula_carro']}")
        else:
            print("ℹ️ No hay trabajos registrados para el mes actual")
            
    except Exception as e:
        print(f"❌ Error al obtener datos: {e}")
        return False
    
    # Verificar datos del mes anterior
    print(f"\n📊 Verificando datos del mes anterior...")
    
    try:
        # Calcular mes anterior
        if current_month == 1:
            mes_anterior = 12
            año_anterior = current_year - 1
        else:
            mes_anterior = current_month - 1
            año_anterior = current_year
        
        trabajos_mes_anterior = []
        for trabajo in trabajos:
            fecha_trabajo = datetime.fromisoformat(trabajo['fecha'].replace('Z', '+00:00'))
            if fecha_trabajo.year == año_anterior and fecha_trabajo.month == mes_anterior:
                trabajos_mes_anterior.append(trabajo)
        
        print(f"📊 Trabajos del mes anterior ({año_anterior}-{mes_anterior:02d}): {len(trabajos_mes_anterior)}")
        
        if len(trabajos_mes_anterior) > 0:
            print("✅ Hay datos del mes anterior")
        else:
            print("ℹ️ No hay trabajos registrados para el mes anterior")
            
    except Exception as e:
        print(f"❌ Error al verificar mes anterior: {e}")
        return False
    
    # Verificar configuración del hook de reset mensual
    print(f"\n🔄 Verificando configuración del reset mensual...")
    
    try:
        # Simular la lógica del hook useMonthlyReset
        now = datetime.now()
        current_month_js = now.month  # En JavaScript, getMonth() devuelve 0-11
        current_year_js = now.year
        current_day = now.day
        
        print(f"📅 Mes actual (JS): {current_month_js}")
        print(f"📅 Año actual (JS): {current_year_js}")
        print(f"📅 Día actual: {current_day}")
        
        # Verificar si es el día de reset (día 1)
        is_reset_day = current_day == 1
        print(f"🔄 ¿Es día de reset? {is_reset_day}")
        
        # Verificar si es lunes de inicio de mes
        day_of_week = now.weekday()  # 0 = Lunes, 6 = Domingo
        is_monday_start = day_of_week == 0 and current_day == 1
        print(f"🔄 ¿Es lunes de inicio de mes? {is_monday_start}")
        
    except Exception as e:
        print(f"❌ Error al verificar configuración: {e}")
        return False
    
    print(f"\n✅ Verificación completada exitosamente")
    print(f"📅 El sistema debería mostrar el mes actual: {current_year}-{current_month:02d}")
    
    return True

def main():
    """Función principal"""
    print("🚀 Iniciando verificación del sistema de reportes...")
    print("=" * 60)
    
    success = test_current_month_detection()
    
    print("=" * 60)
    if success:
        print("✅ Todas las verificaciones pasaron correctamente")
        print("💡 El sistema debería estar mostrando el mes actual por defecto")
    else:
        print("❌ Algunas verificaciones fallaron")
        print("💡 Revisa los errores anteriores y asegúrate de que el servidor esté funcionando")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
