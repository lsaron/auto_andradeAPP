#!/usr/bin/env python3
"""
Script simple para limpiar únicamente la tabla de mecánicos (sin confirmación)
Auto Andrade - Sistema de Comisiones
"""

import requests

def limpiar_mecanicos_simple():
    """Limpia la tabla de mecánicos sin confirmación"""
    
    print("🧹 Limpiando tabla de mecánicos (modo simple)...")
    print("=" * 50)
    
    try:
        # 1. Obtener todos los mecánicos
        print("📋 Obteniendo lista de mecánicos...")
        response = requests.get("http://localhost:8000/api/mecanicos/")
        
        if response.status_code != 200:
            print(f"❌ Error al obtener mecánicos: {response.status_code}")
            return
        
        mecanicos = response.json()
        print(f"📊 Mecánicos encontrados: {len(mecanicos)}")
        
        if len(mecanicos) == 0:
            print("✅ La tabla de mecánicos ya está vacía")
            return
        
        # 2. Eliminar cada mecánico
        print(f"\n🗑️ Eliminando {len(mecanicos)} mecánicos...")
        eliminados = 0
        
        for mecanico in mecanicos:
            try:
                response = requests.delete(f"http://localhost:8000/api/mecanicos/{mecanico['id']}")
                
                if response.status_code == 200:
                    print(f"   ✅ Mecánico {mecanico['id']} ({mecanico['nombre']}) eliminado")
                    eliminados += 1
                else:
                    print(f"   ❌ Error al eliminar mecánico {mecanico['id']}: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Error de conexión: {e}")
        
        # 3. Resultado final
        print(f"\n📊 Resultado: {eliminados}/{len(mecanicos)} mecánicos eliminados")
        
        if eliminados == len(mecanicos):
            print("✅ Tabla de mecánicos limpiada completamente")
        else:
            print("⚠️ Algunos mecánicos no pudieron ser eliminados")
            
    except Exception as e:
        print(f"❌ Error general: {e}")

if __name__ == "__main__":
    limpiar_mecanicos_simple()
