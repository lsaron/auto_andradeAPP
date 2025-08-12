import requests
import json

# URL base del API
BASE_URL = "http://localhost:8000"

def debug_historial_completo():
    """Debug completo del sistema de historial"""
    
    print("🚀 DEBUG COMPLETO DEL SISTEMA DE HISTORIAL")
    print("=" * 60)
    
    # 1. Verificar que el servidor esté funcionando
    print("\n1️⃣ Verificando servidor...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"✅ Servidor funcionando (docs disponibles)")
    except:
        print("❌ Servidor no disponible")
        return
    
    # 2. Obtener lista de carros
    print("\n2️⃣ Obteniendo lista de carros...")
    try:
        response = requests.get(f"{BASE_URL}/api/carros/")
        if response.status_code == 200:
            carros = response.json()
            print(f"✅ Carros encontrados: {len(carros)}")
            for i, carro in enumerate(carros[:3]):  # Mostrar solo los primeros 3
                print(f"   {i+1}. {carro['matricula']} - {carro['marca']} {carro['modelo']} - Dueño: {carro['nombre_cliente']}")
        else:
            print(f"❌ Error obteniendo carros: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 3. Probar con el primer carro disponible
    if carros:
        matricula = carros[0]['matricula']
        print(f"\n3️⃣ Probando con carro: {matricula}")
        
        # 3.1 Verificar endpoint de historial
        print(f"\n3.1️⃣ Probando endpoint de historial...")
        try:
            response = requests.get(f"{BASE_URL}/api/historial-duenos/carro/{matricula}")
            print(f"📡 Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Datos recibidos: {json.dumps(data, indent=2, ensure_ascii=False)}")
                
                if isinstance(data, list):
                    print(f"📊 Total de registros: {len(data)}")
                    
                    for i, registro in enumerate(data):
                        print(f"\n📋 Registro {i+1}:")
                        print(f"   ID: {registro.get('id')}")
                        print(f"   Cliente: {registro.get('nombre_cliente_anterior')}")
                        print(f"   Fecha cambio: {registro.get('fecha_cambio')}")
                        print(f"   Fecha fin: {registro.get('fecha_fin')}")
                        print(f"   Tiene fecha_fin: {registro.get('fecha_fin') is not None}")
                        print(f"   Es propietario anterior: {registro.get('fecha_fin') is not None}")
                else:
                    print(f"⚠️ Formato inesperado: {type(data)}")
                    
            elif response.status_code == 404:
                print("❌ No se encontró historial para este vehículo")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Respuesta: {response.text}")
                
        except Exception as e:
            print(f"❌ Error en endpoint de historial: {e}")
        
        # 3.2 Verificar endpoint de historial completo del carro
        print(f"\n3.2️⃣ Probando endpoint de historial completo del carro...")
        try:
            response = requests.get(f"{BASE_URL}/api/carros/historial/{matricula}")
            print(f"📡 Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Datos del historial completo:")
                print(f"   Dueño actual: {data.get('dueno_actual', {}).get('nombre', 'N/A')}")
                print(f"   Historial de dueños: {len(data.get('historial_duenos', []))}")
                print(f"   Historial de trabajos: {len(data.get('historial_trabajos', []))}")
                
                # Mostrar historial de dueños
                historial_duenos = data.get('historial_duenos', [])
                if historial_duenos:
                    print(f"\n📋 Historial de dueños:")
                    for i, h in enumerate(historial_duenos):
                        print(f"   {i+1}. {h.get('nombre', 'N/A')} - Desde: {h.get('fecha_inicio')} - Hasta: {h.get('fecha_fin')}")
                else:
                    print("   ⚠️ No hay historial de dueños")
                    
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Respuesta: {response.text}")
                
        except Exception as e:
            print(f"❌ Error en historial completo: {e}")
    
    # 4. Verificar endpoint de prueba
    print(f"\n4️⃣ Probando endpoint de prueba...")
    try:
        response = requests.get(f"{BASE_URL}/api/historial-duenos/test")
        if response.status_code == 200:
            print(f"✅ Endpoint de prueba funcionando: {response.json()}")
        else:
            print(f"❌ Error en endpoint de prueba: {response.status_code}")
    except Exception as e:
        print(f"❌ Error en endpoint de prueba: {e}")
    
    print("\n" + "=" * 60)
    print("🏁 DEBUG COMPLETADO")

if __name__ == "__main__":
    debug_historial_completo()
