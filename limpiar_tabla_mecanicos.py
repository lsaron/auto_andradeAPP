#!/usr/bin/env python3
"""
Script para limpiar únicamente la tabla de mecánicos
Auto Andrade - Sistema de Comisiones
"""

import requests
import json

def limpiar_tabla_mecanicos():
    """Limpia únicamente la tabla de mecánicos"""
    
    print("🧹 Limpiando tabla de mecánicos...")
    print("=" * 50)
    
    try:
        # 1. Obtener todos los mecánicos
        print("📋 Obteniendo lista de mecánicos...")
        response = requests.get("http://localhost:8000/api/mecanicos/")
        
        if response.status_code != 200:
            print(f"❌ Error al obtener mecánicos: {response.status_code}")
            print(response.text)
            return
        
        mecanicos = response.json()
        print(f"📊 Mecánicos encontrados: {len(mecanicos)}")
        
        if len(mecanicos) == 0:
            print("✅ La tabla de mecánicos ya está vacía")
            return
        
        # 2. Mostrar mecánicos que se van a eliminar
        print("\n🗑️ Mecánicos que se eliminarán:")
        for mecanico in mecanicos:
            print(f"   - ID: {mecanico['id']} | Nombre: {mecanico['nombre']} | ID Nacional: {mecanico.get('id_nacional', 'N/A')}")
        
        # 3. Confirmar eliminación
        print(f"\n⚠️ ¿Estás seguro de que quieres eliminar {len(mecanicos)} mecánicos?")
        confirmacion = input("Escribe 'SI' para confirmar: ")
        
        if confirmacion.upper() != 'SI':
            print("❌ Operación cancelada")
            return
        
        # 4. Eliminar cada mecánico
        print("\n🗑️ Eliminando mecánicos...")
        eliminados = 0
        errores = 0
        
        for mecanico in mecanicos:
            try:
                print(f"   Eliminando mecánico {mecanico['id']} ({mecanico['nombre']})...")
                response = requests.delete(f"http://localhost:8000/api/mecanicos/{mecanico['id']}")
                
                if response.status_code == 200:
                    print(f"   ✅ Mecánico {mecanico['id']} eliminado")
                    eliminados += 1
                else:
                    print(f"   ❌ Error al eliminar mecánico {mecanico['id']}: {response.status_code}")
                    print(f"      Respuesta: {response.text}")
                    errores += 1
                    
            except Exception as e:
                print(f"   ❌ Error de conexión al eliminar mecánico {mecanico['id']}: {e}")
                errores += 1
        
        # 5. Verificar resultado
        print(f"\n📊 Resultado de la limpieza:")
        print(f"   ✅ Mecánicos eliminados: {eliminados}")
        print(f"   ❌ Errores: {errores}")
        
        # 6. Verificar que la tabla esté vacía
        print("\n🔍 Verificando que la tabla esté vacía...")
        response = requests.get("http://localhost:8000/api/mecanicos/")
        
        if response.status_code == 200:
            mecanicos_restantes = response.json()
            if len(mecanicos_restantes) == 0:
                print("✅ Tabla de mecánicos limpiada exitosamente")
            else:
                print(f"⚠️ Quedan {len(mecanicos_restantes)} mecánicos en la tabla")
        else:
            print(f"❌ Error al verificar tabla: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error general: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    limpiar_tabla_mecanicos()
