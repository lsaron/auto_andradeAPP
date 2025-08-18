#!/usr/bin/env python3
"""
Script de prueba para la funcionalidad de autenticación
"""

import hashlib
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"
TEST_USERNAME = "leonardo"
TEST_PASSWORD = "Andrade1207"  # La contraseña correcta

def test_password_hash():
    """Prueba la generación del hash SHA1"""
    print("🔐 Probando generación de hash SHA1...")
    
    # Generar hash de la contraseña
    password_hash = hashlib.sha1(TEST_PASSWORD.encode('utf-8')).hexdigest()
    print(f"Contraseña: {TEST_PASSWORD}")
    print(f"Hash SHA1: {password_hash}")
    
    # Verificar que coincida con el hash en la base de datos
    expected_hash = "dd69f29e407db6bd0c3bf964ae6f2fa752bd04d2"
    if password_hash == expected_hash:
        print("✅ Hash generado correctamente y coincide con la base de datos")
    else:
        print("❌ Hash no coincide con la base de datos")
        print(f"Esperado: {expected_hash}")
        print(f"Generado: {password_hash}")
    
    return password_hash

def test_auth_endpoint():
    """Prueba el endpoint de autenticación"""
    print("\n🌐 Probando endpoint de autenticación...")
    
    # Datos de autenticación
    auth_data = {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    }
    
    try:
        # Llamada al endpoint
        response = requests.post(
            f"{BASE_URL}/api/auth",
            json=auth_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Data: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            if data.get("success"):
                print("✅ Autenticación exitosa")
                print(f"Usuario: {data.get('nombre_completo', 'N/A')}")
            else:
                print("❌ Autenticación fallida")
                print(f"Error: {data.get('message', 'N/A')}")
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión: No se puede conectar al servidor")
        print("Asegúrate de que el servidor FastAPI esté ejecutándose en http://localhost:8000")
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")

def test_invalid_credentials():
    """Prueba con credenciales inválidas"""
    print("\n🚫 Probando credenciales inválidas...")
    
    # Usuario incorrecto
    auth_data = {
        "username": "usuario_incorrecto",
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth",
            json=auth_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            if not data.get("success"):
                print("✅ Correctamente rechaza usuario incorrecto")
            else:
                print("❌ Incorrectamente acepta usuario incorrecto")
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Contraseña incorrecta
    auth_data = {
        "username": TEST_USERNAME,
        "password": "contraseña_incorrecta"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth",
            json=auth_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            if not data.get("success"):
                print("✅ Correctamente rechaza contraseña incorrecta")
            else:
                print("❌ Incorrectamente acepta contraseña incorrecta")
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Iniciando pruebas de autenticación...")
    print("=" * 50)
    
    # Probar generación de hash
    test_password_hash()
    
    # Probar endpoint de autenticación
    test_auth_endpoint()
    
    # Probar credenciales inválidas
    test_invalid_credentials()
    
    print("\n" + "=" * 50)
    print("🏁 Pruebas completadas")
