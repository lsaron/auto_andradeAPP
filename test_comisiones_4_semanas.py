#!/usr/bin/env python3
"""
Script de prueba para verificar el sistema de comisiones con 4 semanas
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"
MECANICO_ID = 3  # ID del mecánico "Macho" del backup

def test_servidor():
    """Prueba si el servidor está funcionando"""
    print("🧪 Probando conexión al servidor...")
    
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Servidor FastAPI está funcionando")
            return True
        else:
            print(f"⚠️ Servidor responde pero no es FastAPI: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ No se puede conectar al servidor: {e}")
        return False

def test_comisiones_por_semana():
    """Prueba obtener comisiones para cada una de las 4 semanas"""
    print("\n🧪 Probando comisiones por semana...")
    
    # Probar las 4 semanas del frontend
    semanas = [
        ("1", "Semana 1 (No es quincena)"),
        ("2", "Semana 2 (Quincena 1 - Días 1-15)"),
        ("3", "Semana 3 (No es quincena)"),
        ("4", "Semana 4 (Quincena 2 - Días 16-31)")
    ]
    
    for semana_num, descripcion in semanas:
        print(f"\n📅 {descripcion}")
        print(f"   Semana: {semana_num}")
        
        # Construir quincena para el backend
        if semana_num in ["2", "4"]:
            quincena = f"2025-Q{1 if semana_num == '2' else 2}"
            print(f"   Quincena backend: {quincena}")
            
            try:
                url = f"{BASE_URL}/mecanicos/{MECANICO_ID}/comisiones/quincena/{quincena}"
                print(f"   URL: {url}")
                
                response = requests.get(url)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    comisiones = response.json()
                    print(f"   ✅ Comisiones encontradas: {len(comisiones)}")
                    
                    if comisiones:
                        print("   📊 Detalles de las comisiones:")
                        for i, comision in enumerate(comisiones[:2]):  # Mostrar solo las primeras 2
                            print(f"     {i+1}. ID: {comision.get('id')}")
                            print(f"        Trabajo: {comision.get('descripcion_trabajo')}")
                            print(f"        Monto: ₡{comision.get('monto_comision'):,.2f}")
                            print(f"        Estado: {comision.get('estado_comision')}")
                            print(f"        Fecha: {comision.get('fecha_trabajo')}")
                    else:
                        print("   ⚠️ No hay comisiones para esta quincena")
                else:
                    print(f"   ❌ Error: {response.text}")
                    
            except Exception as e:
                print(f"   ❌ Error de conexión: {e}")
        else:
            print("   ℹ️ No es quincena - no se cargan comisiones")

def test_aprobar_comisiones():
    """Prueba aprobar comisiones de una quincena"""
    print("\n🧪 Probando aprobar comisiones...")
    
    quincena = "2025-Q1"  # Quincena 1 (semanas 1-2)
    print(f"📅 Quincena: {quincena}")
    
    try:
        url = f"{BASE_URL}/mecanicos/{MECANICO_ID}/comisiones/quincena/{quincena}/estado"
        data = {"aprobar": True}
        
        response = requests.post(url, json=data)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ Comisiones aprobadas exitosamente")
            print(f"📊 Resultado: {json.dumps(resultado, indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

def main():
    """Función principal"""
    print("🚀 Iniciando pruebas del sistema de comisiones con 4 semanas")
    print("=" * 70)
    
    # Verificar servidor
    if not test_servidor():
        print("💡 Asegúrate de que el servidor esté corriendo en http://localhost:8000")
        return
    
    # Probar comisiones por semana
    test_comisiones_por_semana()
    
    # Probar aprobar comisiones
    test_aprobar_comisiones()
    
    print("\n" + "=" * 70)
    print("🏁 Pruebas completadas")
    print("\n💡 Resumen del sistema:")
    print("   - Semana 1: No es quincena")
    print("   - Semana 2: Quincena 1 (días 1-15) → Backend: 2025-Q1")
    print("   - Semana 3: No es quincena")
    print("   - Semana 4: Quincena 2 (días 16-31) → Backend: 2025-Q2")

if __name__ == "__main__":
    main()
