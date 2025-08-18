# 🔐 Sistema de Autenticación - Auto Andrade

## Descripción

Se ha implementado un sistema de autenticación seguro para la sección de datos financieros en la aplicación de gestión de carros. El sistema utiliza hash SHA1 para almacenar las contraseñas de manera segura.

## 🗄️ Base de Datos

### Tabla: `admin_taller`

```sql
CREATE TABLE IF NOT EXISTS admin_taller (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Usuario por Defecto

- **Username**: `leonardo`
- **Password**: `Andrade1207`
- **Hash SHA1**: `dd69f29e407db6bd0c3bf964ae6f2fa752bd04d2`
- **Nombre Completo**: `Leonardo Andrade`

## 🚀 Backend (FastAPI)

### Endpoint de Autenticación

```
POST /api/auth
```

#### Request Body
```json
{
    "username": "leonardo",
    "password": "Andrade1207"
}
```

#### Response
```json
{
    "success": true,
    "message": "Autenticación exitosa",
    "nombre_completo": "Leonardo Andrade"
}
```

### Archivos Implementados

1. **Modelo**: `app/models/admin_taller.py`
2. **Schema**: `app/schemas/auth.py`
3. **Ruta**: `app/routes/auth.py`
4. **Configuración**: `app/main.py` (actualizado)

## 🎨 Frontend (Next.js)

### Componente: `cars-section.tsx`

- Modal de autenticación para datos financieros
- Username fijo: `leonardo`
- Campo de contraseña protegido
- Manejo de errores de autenticación
- Estado de desbloqueo de datos financieros

### Funcionalidades

- ✅ Autenticación con username y contraseña
- ✅ Validación de credenciales
- ✅ Mensajes de error descriptivos
- ✅ Interfaz de usuario intuitiva
- ✅ Protección de datos financieros

## 🧪 Pruebas

### Script de Prueba: `test_auth.py`

```bash
py test_auth.py
```

### Verificación SQL: `verificar_admin_taller.sql`

```bash
mysql -u root -p < verificar_admin_taller.sql
```

## 🔧 Instalación y Configuración

### 1. Crear la Base de Datos

```sql
USE autoandrade;

-- Crear tabla admin_taller
CREATE TABLE IF NOT EXISTS admin_taller (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario administrador
INSERT INTO admin_taller (username, password_hash, nombre_completo) 
VALUES ('leonardo', 'dd69f29e407db6bd0c3bf964ae6f2fa752bd04d2', 'Leonardo Andrade');

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_admin_username ON admin_taller(username);
```

### 2. Reiniciar el Servidor Backend

```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Verificar el Frontend

El modal de autenticación aparecerá automáticamente cuando se intente acceder a datos financieros.

## 🔒 Seguridad

- **Hash SHA1**: Las contraseñas se almacenan como hash SHA1
- **Validación**: Verificación de username y contraseña en el backend
- **Sesión**: Estado de autenticación mantenido en el frontend
- **Protección**: Datos financieros solo accesibles tras autenticación exitosa

## 🐛 Solución de Problemas

### Error de Conexión
- Verificar que el servidor FastAPI esté ejecutándose en `http://localhost:8000`
- Verificar la configuración de CORS

### Error de Autenticación
- Verificar que la tabla `admin_taller` exista en la base de datos
- Verificar que el usuario `leonardo` esté insertado correctamente
- Verificar que el hash de la contraseña coincida

### Error de Frontend
- Verificar que el componente `cars-section.tsx` esté actualizado
- Verificar que la API esté respondiendo correctamente

## 📝 Notas Técnicas

- **Hash SHA1**: Aunque SHA1 no es el algoritmo más seguro, se mantiene por compatibilidad con la base de datos existente
- **Estado Local**: La autenticación se mantiene en el estado local del componente
- **Sin Persistencia**: La sesión se pierde al recargar la página (diseño intencional para seguridad)

## 🔮 Mejoras Futuras

- [ ] Implementar JWT para sesiones persistentes
- [ ] Agregar rate limiting para prevenir ataques de fuerza bruta
- [ ] Implementar logout automático por inactividad
- [ ] Agregar auditoría de intentos de autenticación
- [ ] Migrar a algoritmos de hash más seguros (bcrypt, Argon2)
