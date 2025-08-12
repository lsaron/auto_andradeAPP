import urllib.request
import urllib.error
import json

# URL base del API
BASE_URL = "http://localhost:8000"

def make_request(url, method="GET", data=None):
    """Hacer una petición HTTP simple"""
    try:
        if method == "GET":
            with urllib.request.urlopen(url) as response:
                return response.read().decode('utf-8'), response.status
        elif method == "PUT":
            req = urllib.request.Request(url, data=data.encode('utf-8'), method='PUT')
            req.add_header('Content-Type', 'application/json')
            with urllib.request.urlopen(req) as response:
                return response.read().decode('utf-8'), response.status
    except urllib.error.HTTPError as e:
        return e.read().decode('utf-8'), e.code
    except urllib.error.URLError as e:
        return str(e), None

def test_cambio_dueno():
    """Probar el cambio de dueño y verificar historial"""
    
    print("🚀 PRUEBA DE CAMBIO DE DUEÑO")
    print("=" * 50)
    
    # 1. Obtener lista de carros
    print("\n1️⃣ Obteniendo lista de carros...")
    try:
        data, status = make_request(f"{BASE_URL}/api/carros/")
        if status == 200:
            carros = json.loads(data)
            print(f"✅ Carros encontrados: {len(carros)}")
            for i, carro in enumerate(carros[:3]):
                print(f"   {i+1}. {carro['matricula']} - {carro['marca']} {carro['modelo']} - Dueño: {carro['nombre_cliente']}")
        else:
            print(f"❌ Error obteniendo carros: {status}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 2. Obtener lista de clientes para cambiar
    print("\n2️⃣ Obteniendo lista de clientes...")
    try:
        data, status = make_request(f"{BASE_URL}/api/clientes/")
        if status == 200:
            clientes = json.loads(data)
            print(f"✅ Clientes encontrados: {len(clientes)}")
            for i, cliente in enumerate(clientes[:3]):
                print(f"   {i+1}. {cliente['id_nacional']} - {cliente['nombre']}")
        else:
            print(f"❌ Error obteniendo clientes: {status}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    if not carros or not clientes:
        print("❌ No hay carros o clientes para probar")
        return
    
    # 3. Seleccionar carro y cliente para la prueba
    carro_prueba = carros[0]
    cliente_nuevo = clientes[1] if len(clientes) > 1 else clientes[0]
    
    print(f"\n3️⃣ Carro seleccionado para prueba: {carro_prueba['matricula']}")
    print(f"   Dueño actual: {carro_prueba['nombre_cliente']}")
    print(f"   Cliente nuevo: {cliente_nuevo['nombre']}")
    
    # 4. Verificar historial ANTES del cambio
    print(f"\n4️⃣ Verificando historial ANTES del cambio...")
    try:
        data, status = make_request(f"{BASE_URL}/api/historial-duenos/carro/{carro_prueba['matricula']}")
        if status == 200:
            historial_antes = json.loads(data)
            print(f"✅ Historial antes del cambio: {len(historial_antes)} registros")
            for i, h in enumerate(historial_antes):
                print(f"   {i+1}. {h['nombre_cliente_anterior']} - Fecha fin: {h['fecha_fin']}")
        else:
            print(f"⚠️ No hay historial antes del cambio (status: {status})")
    except Exception as e:
        print(f"❌ Error verificando historial: {e}")
    
    # 5. Realizar cambio de dueño
    print(f"\n5️⃣ Realizando cambio de dueño...")
    try:
        # Datos para el cambio
        datos_cambio = {
            "matricula": carro_prueba['matricula'],
            "marca": carro_prueba['marca'],
            "modelo": carro_prueba['modelo'],
            "anio": carro_prueba['anio'],
            "id_cliente_actual": cliente_nuevo['id_nacional']
        }
        
        data, status = make_request(
            f"{BASE_URL}/api/carros/{carro_prueba['matricula']}", 
            method="PUT", 
            data=json.dumps(datos_cambio)
        )
        
        if status == 200:
            print(f"✅ Dueño cambiado exitosamente")
            respuesta = json.loads(data)
            print(f"   Mensaje: {respuesta.get('message', 'N/A')}")
        else:
            print(f"❌ Error cambiando dueño: {status}")
            print(f"   Respuesta: {data}")
            return
    except Exception as e:
        print(f"❌ Error en cambio de dueño: {e}")
        return
    
    # 6. Verificar historial DESPUÉS del cambio
    print(f"\n6️⃣ Verificando historial DESPUÉS del cambio...")
    try:
        data, status = make_request(f"{BASE_URL}/api/historial-duenos/carro/{carro_prueba['matricula']}")
        if status == 200:
            historial_despues = json.loads(data)
            print(f"✅ Historial después del cambio: {len(historial_despues)} registros")
            for i, h in enumerate(historial_despues):
                print(f"   {i+1}. {h['nombre_cliente_anterior']} - Fecha fin: {h['fecha_fin']}")
                
            # Verificar que se creó el historial
            if len(historial_despues) > 0:
                print(f"\n✅ SUCCESS: El historial se creó correctamente!")
                print(f"   Total de registros: {len(historial_despues)}")
                
                # Contar propietarios anteriores (con fecha_fin)
                propietarios_anteriores = [h for h in historial_despues if h['fecha_fin'] is not None]
                print(f"   Propietarios anteriores: {len(propietarios_anteriores)}")
                
                # Contar propietario actual (sin fecha_fin)
                propietario_actual = [h for h in historial_despues if h['fecha_fin'] is None]
                print(f"   Propietario actual: {len(propietario_actual)}")
            else:
                print(f"❌ FAIL: No se creó el historial")
        else:
            print(f"❌ Error verificando historial después: {status}")
    except Exception as e:
        print(f"❌ Error verificando historial después: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 PRUEBA COMPLETADA")

if __name__ == "__main__":
    test_cambio_dueno()
