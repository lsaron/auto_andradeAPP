import requests
import json

# URL base del API
BASE_URL = "http://localhost:8000"

def test_historial_endpoint():
    """Prueba el endpoint de historial de dueños"""
    
    # Matrícula de prueba (cambiar por una que exista en tu base de datos)
    matricula = "ABC-123"  # Cambiar por una matrícula real
    
    print(f"🔍 Probando endpoint de historial para matrícula: {matricula}")
    
    try:
        # Llamar al endpoint
        response = requests.get(f"{BASE_URL}/api/historial-duenos/carro/{matricula}")
        
        print(f"📡 Status Code: {response.status_code}")
        print(f"📡 Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Datos recibidos: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            # Analizar los datos
            if isinstance(data, list):
                print(f"📊 Total de registros: {len(data)}")
                
                for i, registro in enumerate(data):
                    print(f"\n📋 Registro {i+1}:")
                    print(f"   ID: {registro.get('id')}")
                    print(f"   Cliente: {registro.get('nombre_cliente_anterior')}")
                    print(f"   Fecha cambio: {registro.get('fecha_cambio')}")
                    print(f"   Fecha fin: {registro.get('fecha_fin')}")
                    print(f"   Tiene fecha_fin: {registro.get('fecha_fin') is not None}")
            else:
                print(f"⚠️ Formato inesperado: {type(data)}")
                
        elif response.status_code == 404:
            print("❌ No se encontró historial para esta matrícula")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión: No se pudo conectar al servidor")
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")

def test_cambiar_dueno_endpoint():
    """Prueba el endpoint de cambiar dueño"""
    
    print("\n🔄 Probando endpoint de cambiar dueño...")
    
    # Datos de prueba
    test_data = {
        "matricula_carro": "ABC-123",  # Cambiar por una matrícula real
        "id_cliente": "123456789",     # Cambiar por un ID de cliente real
        "fecha_cambio": "2024-01-15",
        "motivo_cambio": "Prueba de cambio de dueño"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/historial-duenos/cambiar_dueno",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dueño cambiado exitosamente: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión: No se pudo conectar al servidor")
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")

if __name__ == "__main__":
    print("🚀 Iniciando pruebas del API de historial de dueños...")
    print("=" * 50)
    
    # Probar obtener historial
    test_historial_endpoint()
    
    # Probar cambiar dueño (comentar si no quieres hacer cambios en la BD)
    # test_cambiar_dueno_endpoint()
    
    print("\n" + "=" * 50)
    print("🏁 Pruebas completadas")
