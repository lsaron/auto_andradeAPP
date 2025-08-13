import urllib.request
import urllib.error
import json
from datetime import datetime

def test_reports_data():
    """Probar los datos que llegan del endpoint de trabajos para reportes"""
    
    print("🔍 PRUEBA DE DATOS PARA REPORTES")
    print("=" * 60)
    
    try:
        # Obtener todos los trabajos
        print("📊 Obteniendo trabajos del backend...")
        with urllib.request.urlopen("http://localhost:8000/api/trabajos/") as response:
            trabajos = json.loads(response.read().decode('utf-8'))
            
            print(f"✅ Trabajos obtenidos: {len(trabajos)}")
            
            if len(trabajos) > 0:
                print("\n📋 MUESTRA DE TRABAJOS:")
                for i, trabajo in enumerate(trabajos[:5]):  # Mostrar solo los primeros 5
                    print(f"\n{i+1}. Trabajo ID: {trabajo['id']}")
                    print(f"   Fecha: {trabajo['fecha']}")
                    print(f"   Placa: {trabajo['matricula_carro']}")
                    print(f"   Cliente: {trabajo['cliente_nombre']}")
                    print(f"   Descripción: {trabajo['descripcion']}")
                    print(f"   Costo: ₡{trabajo['costo']:,.2f}")
                    print(f"   Gastos: ₡{trabajo['total_gastos']:,.2f}")
                    print(f"   Ganancia: ₡{trabajo['ganancia']:,.2f}")
                
                # Analizar fechas
                print(f"\n📅 ANÁLISIS DE FECHAS:")
                fechas = []
                for trabajo in trabajos:
                    try:
                        fecha = datetime.strptime(trabajo['fecha'], '%Y-%m-%d')
                        fechas.append(fecha)
                    except:
                        print(f"⚠️ Fecha inválida en trabajo {trabajo['id']}: {trabajo['fecha']}")
                
                if fechas:
                    fechas.sort()
                    print(f"   Fecha más antigua: {fechas[0].strftime('%Y-%m-%d')}")
                    print(f"   Fecha más reciente: {fechas[-1].strftime('%Y-%m-%d')}")
                    
                    # Agrupar por mes
                    meses = {}
                    for fecha in fechas:
                        mes_key = f"{fecha.year}-{fecha.month:02d}"
                        if mes_key not in meses:
                            meses[mes_key] = 0
                        meses[mes_key] += 1
                    
                    print(f"\n📊 TRABAJOS POR MES:")
                    for mes, cantidad in sorted(meses.items()):
                        print(f"   {mes}: {cantidad} trabajos")
                
            else:
                print("❌ No hay trabajos disponibles")
                
    except urllib.error.HTTPError as e:
        print(f"❌ Error HTTP: {e.code}")
        print(f"   Respuesta: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
    
    print("\n" + "=" * 60)
    print("🏁 PRUEBA COMPLETADA")

if __name__ == "__main__":
    test_reports_data()
