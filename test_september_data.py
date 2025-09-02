#!/usr/bin/env python3
"""
Script rápido para verificar datos de septiembre
"""

import requests
from datetime import datetime

def test_september_data():
    print("🔍 Verificando datos de septiembre...")
    
    try:
        # Obtener trabajos
        response = requests.get("http://localhost:8000/api/trabajos/")
        trabajos = response.json()
        
        print(f"📊 Total de trabajos: {len(trabajos)}")
        
        # Filtrar trabajos de septiembre 2025
        trabajos_septiembre = []
        for trabajo in trabajos:
            fecha = datetime.fromisoformat(trabajo['fecha'].replace('Z', '+00:00'))
            if fecha.year == 2025 and fecha.month == 9:
                trabajos_septiembre.append(trabajo)
        
        print(f"📊 Trabajos de septiembre 2025: {len(trabajos_septiembre)}")
        
        if trabajos_septiembre:
            print("✅ Hay datos de septiembre:")
            for trabajo in trabajos_septiembre:
                print(f"   - {trabajo['fecha']}: {trabajo['descripcion']} - ₡{trabajo['costo']:,.2f}")
        else:
            print("❌ No hay datos de septiembre")
        
        # Verificar todos los meses disponibles
        meses_disponibles = set()
        for trabajo in trabajos:
            fecha = datetime.fromisoformat(trabajo['fecha'].replace('Z', '+00:00'))
            meses_disponibles.add(f"{fecha.year}-{fecha.month:02d}")
        
        print(f"📊 Meses disponibles: {sorted(meses_disponibles)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_september_data()
