import urllib.request
import urllib.error
import json

def test_endpoint_simple():
    """Probar solo el endpoint problemático"""
    
    matricula = "86789"  # El carro que sabemos que tiene historial
    url = f"http://localhost:8000/api/carro/{matricula}/historial"
    
    print(f"🔍 Probando endpoint: {url}")
    
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
            status = response.status
            print(f"✅ Status: {status}")
            print(f"✅ Datos: {data}")
            
            if data:
                try:
                    json_data = json.loads(data)
                    print(f"✅ JSON válido: {json.dumps(json_data, indent=2, ensure_ascii=False)}")
                except:
                    print(f"⚠️ No es JSON válido: {data}")
            else:
                print("⚠️ Respuesta vacía")
                
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error: {e.code}")
        print(f"❌ Respuesta: {e.read().decode('utf-8')}")
    except urllib.error.URLError as e:
        print(f"❌ URL Error: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    test_endpoint_simple()
