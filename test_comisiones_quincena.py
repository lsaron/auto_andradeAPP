#!/usr/bin/env python3
"""
Script de prueba para verificar el sistema de comisiones por quincena
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
MECANICO_ID = 3  # ID del mecánico "Macho" del backup

def test_obtener_comisiones_quincena():
    """Prueba obtener comisiones por quincena"""
    print("🧪 Probando obtener comisiones por quincena...")
    
    # Probar diferentes quincenas
    quincenas = ["2025-Q1", "2025-Q2"]
    
    for quincena in quincenas:
        print(f"\n📅 Probando quincena: {quincena}")
        
        try:
            url = f"{BASE_URL}/mecanicos/{MECANICO_ID}/comisiones/quincena/{quincena}"
            response = requests.get(url)
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                comisiones = response.json()
                print(f"✅ Comisiones encontradas: {len(comisiones)}")
                
                if comisiones:
                    print("📊 Detalles de las comisiones:")
                    for i, comision in enumerate(comisiones[:3]):  # Mostrar solo las primeras 3
                        print(f"  {i+1}. ID: {comision.get('id')}")
                        print(f"     Trabajo: {comision.get('descripcion_trabajo')}")
                        print(f"     Monto: ₡{comision.get('monto_comision'):,.2f}")
                        print(f"     Estado: {comision.get('estado_comision')}")
                        print(f"     Fecha: {comision.get('fecha_trabajo')}")
                        print()
                else:
                    print("⚠️ No hay comisiones para esta quincena")
            else:
                print(f"❌ Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Error de conexión: {e}")

def test_aprobar_comisiones_quincena():
    """Prueba aprobar comisiones de una quincena"""
    print("\n🧪 Probando aprobar comisiones de quincena...")
    
    quincena = "2025-Q1"
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

def test_denegar_comisiones_quincena():
    """Prueba denegar comisiones de una quincena"""
    print("\n🧪 Probando denegar comisiones de quincena...")
    
    quincena = "2025-Q2"
    print(f"📅 Quincena: {quincena}")
    
    try:
        url = f"{BASE_URL}/mecanicos/{MECANICO_ID}/comisiones/quincena/{quincena}/estado"
        data = {"aprobar": False}
        
        response = requests.post(url, json=data)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ Comisiones denegadas exitosamente")
            print(f"📊 Resultado: {json.dumps(resultado, indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

def main():
    """Función principal"""
    print("🚀 Iniciando pruebas del sistema de comisiones por quincena")
    print("=" * 60)
    
    # Verificar que el servidor esté corriendo
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Servidor FastAPI está corriendo")
        else:
            print("⚠️ Servidor responde pero no es FastAPI")
    except Exception as e:
        print(f"❌ No se puede conectar al servidor: {e}")
        print("💡 Asegúrate de que el servidor esté corriendo en http://localhost:8000")
        return
    
    print()
    
    # Ejecutar pruebas
    test_obtener_comisiones_quincena()
    test_aprobar_comisiones_quincena()
    test_denegar_comisiones_quincena()
    
    print("\n" + "=" * 60)
    print("🏁 Pruebas completadas")

if __name__ == "__main__":
    main()

