# Módulo de Taller - Auto Andrade

Este documento describe la implementación del módulo de taller que incluye la gestión de gastos del taller y pagos de salarios a mecánicos.

## 🏗️ Estructura del Módulo

### Backend (Python/FastAPI)

#### Modelos de Base de Datos
- **`app/models/gastos_taller.py`** - Modelo para gastos generales del taller
- **`app/models/pagos_salarios.py`** - Modelo para pagos de salarios a mecánicos

#### Esquemas Pydantic
- **`app/schemas/gastos_taller.py`** - Esquemas para validación de datos de gastos
- **`app/schemas/pagos_salarios.py`** - Esquemas para validación de datos de pagos

#### Rutas de API
- **`app/routes/gastos_taller.py`** - Endpoints para CRUD de gastos del taller
- **`app/routes/pagos_salarios.py`** - Endpoints para CRUD de pagos de salarios

### Frontend (Next.js/React)

#### Componente Principal
- **`dashboard/app/components/taller-section.tsx`** - Interfaz completa del módulo de taller

#### Configuración
- **`dashboard/app/lib/api-config.ts`** - Configuración centralizada de la API

## 🚀 Instalación y Configuración

### 1. Crear las Tablas de Base de Datos

Ejecuta el archivo de migración SQL:

```bash
# En tu base de datos SQLite
sqlite3 auto_andrade.db < migracion_taller.sql
```

**Nota:** Si ya tienes la tabla `pagos_salarios` con el formato anterior de semana (YYYY-WNN), ejecuta también:

```bash
# Para actualizar la estructura existente
sqlite3 auto_andrade.db < migracion_semana_simple.sql
```

### 2. Verificar las Importaciones

Asegúrate de que los nuevos modelos estén incluidos en `app/models/__init__.py`:

```python
from .gastos_taller import GastoTaller
from .pagos_salarios import PagoSalario
```

### 3. Verificar las Rutas

Las nuevas rutas ya están incluidas en `app/main.py`:

```python
app.include_router(gastos_taller.router, prefix="/api")
app.include_router(pagos_salarios.router, prefix="/api")
```

## 📊 Funcionalidades

### Gestión de Gastos del Taller

- ✅ **Crear gastos** con categorías predefinidas (luz, agua, herramientas, etc.)
- ✅ **Editar gastos** existentes
- ✅ **Eliminar gastos** con confirmación
- ✅ **Buscar gastos** por descripción o categoría
- ✅ **Estadísticas** de gastos totales y por mes
- ✅ **Categorías personalizadas** para gastos especiales

### Gestión de Pagos de Salarios

- ✅ **Registrar pagos** de salarios semanales
- ✅ **Asociar pagos** con mecánicos específicos
- ✅ **Seguimiento** de pagos por semana (1, 2, 3 o 4)
- ✅ **Estadísticas** de salarios totales y por mes

### Características Adicionales

- 🔄 **Actualización en tiempo real** de datos
- 📱 **Interfaz responsive** para dispositivos móviles
- 🎨 **Diseño moderno** con componentes UI consistentes
- ⚡ **Validación de datos** en frontend y backend
- 🚨 **Manejo de errores** robusto

## 🔌 Endpoints de la API

### Gastos del Taller

```
POST   /api/gastos-taller/           - Crear nuevo gasto
GET    /api/gastos-taller/           - Listar gastos (con filtros)
GET    /api/gastos-taller/{id}       - Obtener gasto específico
PUT    /api/gastos-taller/{id}       - Actualizar gasto
DELETE /api/gastos-taller/{id}       - Eliminar gasto
GET    /api/gastos-taller/estadisticas/resumen - Estadísticas
```

### Pagos de Salarios

```
POST   /api/pagos-salarios/          - Crear nuevo pago
GET    /api/pagos-salarios/          - Listar pagos (con filtros)
GET    /api/pagos-salarios/{id}      - Obtener pago específico
PUT    /api/pagos-salarios/{id}      - Actualizar pago
DELETE /api/pagos-salarios/{id}      - Eliminar pago
GET    /api/pagos-salarios/estadisticas/resumen - Estadísticas
```

## 🎯 Uso del Frontend

### 1. Acceder al Módulo

El módulo de taller está disponible en la sección correspondiente del dashboard principal.

### 2. Gestión de Gastos

1. **Ver gastos existentes** en la tabla principal
2. **Crear nuevo gasto** con el botón "Nuevo Gasto"
3. **Editar gasto** haciendo clic en el ícono de edición
4. **Eliminar gasto** con el ícono de eliminación
5. **Buscar gastos** usando el campo de búsqueda

### 3. Gestión de Salarios

1. **Ver pagos existentes** en la tabla de salarios
2. **Registrar nuevo pago** con el botón "Pagar Salarios"
3. **Seleccionar mecánico** de la lista desplegable
4. **Especificar monto** y semana de pago

## 🔧 Configuración del Entorno

### Variables de Entorno

```bash
# En el frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# En el backend (opcional, por defecto usa localhost:8000)
API_BASE_URL=http://localhost:8000
```

### Dependencias

#### Backend
```bash
# Ya incluidas en requirements.txt
fastapi
sqlalchemy
pydantic
```

#### Frontend
```bash
# Ya incluidas en package.json
react
next
typescript
tailwindcss
```

## 🧪 Pruebas

### 1. Probar la API

```bash
# Iniciar el servidor backend
cd app
uvicorn main:app --reload

# Probar endpoints
curl http://localhost:8000/api/gastos-taller/
curl http://localhost:8000/api/pagos-salarios/
```

### 2. Probar el Frontend

```bash
# En otra terminal
cd dashboard
npm run dev

# Abrir http://localhost:3000
# Navegar a la sección de taller
```

## 📝 Notas de Implementación

### Estructura de Datos

- **Gastos del Taller**: Incluyen descripción, monto, categoría y fecha
- **Pagos de Salarios**: Incluyen mecánico, monto, semana y fecha de pago
- **Categorías**: Sistema flexible que permite categorías predefinidas y personalizadas

### Validaciones

- **Frontend**: Validación en tiempo real de formularios
- **Backend**: Validación Pydantic para integridad de datos
- **Base de Datos**: Constraints de SQL para consistencia

### Seguridad

- **CORS**: Configurado para permitir comunicación entre frontend y backend
- **Validación**: Todos los inputs son validados antes de procesarse
- **Manejo de Errores**: Respuestas de error consistentes y informativas

## 🚨 Solución de Problemas

### Error de Conexión a la API

```bash
# Verificar que el backend esté ejecutándose
curl http://localhost:8000/

# Verificar CORS en el backend
# Verificar variables de entorno en el frontend
```

### Error de Base de Datos

```bash
# Verificar que las tablas existan
sqlite3 auto_andrade.db ".tables"

# Verificar estructura de tablas
sqlite3 auto_andrade.db ".schema gastos_taller"
sqlite3 auto_andrade.db ".schema pagos_salarios"
```

### Error de Frontend

```bash
# Verificar consola del navegador
# Verificar logs de Next.js
# Verificar que buildApiUrl esté funcionando
```

## 🔮 Próximas Mejoras

- [ ] **Reportes PDF** de gastos y salarios
- [ ] **Notificaciones** para pagos pendientes
- [ ] **Integración** con sistema de facturación
- [ ] **Dashboard** de métricas avanzadas
- [ ] **Exportación** de datos a Excel/CSV
- [ ] **Auditoría** de cambios en gastos y pagos

## 📞 Soporte

Para dudas o problemas con la implementación:

1. Revisar este README
2. Verificar logs del backend y frontend
3. Consultar la documentación de FastAPI y Next.js
4. Revisar el código fuente para entender la implementación

---

**Desarrollado para Auto Andrade** 🚗🔧
