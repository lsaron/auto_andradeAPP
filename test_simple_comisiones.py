#!/usr/bin/env python3
"""
Script de prueba simple para verificar la API de comisiones
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"

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

def test_mecanicos():
    """Prueba obtener lista de mecánicos"""
    print("\n🧪 Probando obtener mecánicos...")
    
    try:
        response = requests.get(f"{BASE_URL}/mecanicos")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            mecanicos = response.json()
            print(f"✅ Mecánicos encontrados: {len(mecanicos)}")
            
            for mecanico in mecanicos:
                print(f"  - ID: {mecanico.get('id')}, Nombre: {mecanico.get('nombre')}")
            
            return mecanicos
        else:
            print(f"❌ Error: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return []

def test_comisiones_quincena(mecanico_id):
    """Prueba obtener comisiones por quincena"""
    print(f"\n🧪 Probando comisiones para mecánico {mecanico_id}...")
    
    # Probar diferentes quincenas
    quincenas = ["2025-Q1", "2025-Q2"]
    
    for quincena in quincenas:
        print(f"\n📅 Probando quincena: {quincena}")
        
        try:
            url = f"{BASE_URL}/mecanicos/{mecanico_id}/comisiones/quincena/{quincena}"
            print(f"URL: {url}")
            
            response = requests.get(url)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                comisiones = response.json()
                print(f"✅ Comisiones encontradas: {len(comisiones)}")
                
                if comisiones:
                    print("📊 Detalles de las comisiones:")
                    for i, comision in enumerate(comisiones[:3]):
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

def main():
    """Función principal"""
    print("🚀 Iniciando pruebas simples de la API de comisiones")
    print("=" * 60)
    
    # Verificar servidor
    if not test_servidor():
        print("💡 Asegúrate de que el servidor esté corriendo en http://localhost:8000")
        return
    
    # Obtener mecánicos
    mecanicos = test_mecanicos()
    if not mecanicos:
        print("❌ No se pudieron obtener mecánicos")
        return
    
    # Probar comisiones para el primer mecánico
    if mecanicos:
        primer_mecanico = mecanicos[0]
        mecanico_id = primer_mecanico.get('id')
        print(f"\n🎯 Probando comisiones para: {primer_mecanico.get('nombre')} (ID: {mecanico_id})")
        
        test_comisiones_quincena(mecanico_id)
    
    print("\n" + "=" * 60)
    print("🏁 Pruebas completadas")

if __name__ == "__main__":
    main()
