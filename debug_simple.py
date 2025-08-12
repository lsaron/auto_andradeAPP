import urllib.request
import urllib.error
import json

# URL base del API
BASE_URL = "http://localhost:8000"

def make_request(url):
    """Hacer una petición HTTP simple"""
    try:
        with urllib.request.urlopen(url) as response:
            return response.read().decode('utf-8'), response.status
    except urllib.error.HTTPError as e:
        return e.read().decode('utf-8'), e.code
    except urllib.error.URLError as e:
        return str(e), None

def debug_historial_simple():
    """Debug simple del sistema de historial"""
    
    print("🚀 DEBUG SIMPLE DEL SISTEMA DE HISTORIAL")
    print("=" * 50)
    
    # 1. Verificar que el servidor esté funcionando
    print("\n1️⃣ Verificando servidor...")
    try:
        data, status = make_request(f"{BASE_URL}/docs")
        if status == 200:
            print("✅ Servidor funcionando (docs disponibles)")
        else:
            print(f"⚠️ Servidor responde con status: {status}")
    except Exception as e:
        print(f"❌ Error conectando al servidor: {e}")
        return
    
    # 2. Obtener lista de carros
    print("\n2️⃣ Obteniendo lista de carros...")
    try:
        data, status = make_request(f"{BASE_URL}/api/carros/")
        if status == 200:
            carros = json.loads(data)
            print(f"✅ Carros encontrados: {len(carros)}")
            for i, carro in enumerate(carros[:3]):  # Mostrar solo los primeros 3
                print(f"   {i+1}. {carro['matricula']} - {carro['marca']} {carro['modelo']} - Dueño: {carro['nombre_cliente']}")
        else:
            print(f"❌ Error obteniendo carros: {status}")
            print(f"Respuesta: {data}")
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
            data, status = make_request(f"{BASE_URL}/api/historial-duenos/carro/{matricula}")
            print(f"📡 Status: {status}")
            
            if status == 200:
                historial_data = json.loads(data)
                print(f"✅ Datos recibidos: {json.dumps(historial_data, indent=2, ensure_ascii=False)}")
                
                if isinstance(historial_data, list):
                    print(f"📊 Total de registros: {len(historial_data)}")
                    
                    for i, registro in enumerate(historial_data):
                        print(f"\n📋 Registro {i+1}:")
                        print(f"   ID: {registro.get('id')}")
                        print(f"   Cliente: {registro.get('nombre_cliente_anterior')}")
                        print(f"   Fecha cambio: {registro.get('fecha_cambio')}")
                        print(f"   Fecha fin: {registro.get('fecha_fin')}")
                        print(f"   Tiene fecha_fin: {registro.get('fecha_fin') is not None}")
                        print(f"   Es propietario anterior: {registro.get('fecha_fin') is not None}")
                else:
                    print(f"⚠️ Formato inesperado: {type(historial_data)}")
                    
            elif status == 404:
                print("❌ No se encontró historial para este vehículo")
            else:
                print(f"❌ Error: {status}")
                print(f"Respuesta: {data}")
                
        except Exception as e:
            print(f"❌ Error en endpoint de historial: {e}")
        
        # 3.2 Verificar endpoint de historial completo del carro
        print(f"\n3.2️⃣ Probando endpoint de historial completo del carro...")
        try:
            data, status = make_request(f"{BASE_URL}/api/carros/historial/{matricula}")
            print(f"📡 Status: {status}")
            
            if status == 200:
                historial_completo = json.loads(data)
                print(f"✅ Datos del historial completo:")
                print(f"   Dueño actual: {historial_completo.get('dueno_actual', {}).get('nombre', 'N/A')}")
                print(f"   Historial de dueños: {len(historial_completo.get('historial_duenos', []))}")
                print(f"   Historial de trabajos: {len(historial_completo.get('historial_trabajos', []))}")
                
                # Mostrar historial de dueños
                historial_duenos = historial_completo.get('historial_duenos', [])
                if historial_duenos:
                    print(f"\n📋 Historial de dueños:")
                    for i, h in enumerate(historial_duenos):
                        print(f"   {i+1}. {h.get('nombre', 'N/A')} - Desde: {h.get('fecha_inicio')} - Hasta: {h.get('fecha_fin')}")
                else:
                    print("   ⚠️ No hay historial de dueños")
                    
            else:
                print(f"❌ Error: {status}")
                print(f"Respuesta: {data}")
                
        except Exception as e:
            print(f"❌ Error en historial completo: {e}")
    
    # 4. Verificar endpoint de prueba
    print(f"\n4️⃣ Probando endpoint de prueba...")
    try:
        data, status = make_request(f"{BASE_URL}/api/historial-duenos/test")
        if status == 200:
            test_data = json.loads(data)
            print(f"✅ Endpoint de prueba funcionando: {test_data}")
        else:
            print(f"❌ Error en endpoint de prueba: {status}")
    except Exception as e:
        print(f"❌ Error en endpoint de prueba: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 DEBUG COMPLETADO")

if __name__ == "__main__":
    debug_historial_simple()
