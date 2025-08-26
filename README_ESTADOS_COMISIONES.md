# 🎯 Sistema de Estados de Comisiones - Auto Andrade

## 📋 Descripción General

El sistema de estados de comisiones permite al cliente gestionar las comisiones de los mecánicos por períodos quincenales, decidiendo cuáles aprobar o penalizar según su criterio. Esto asegura que solo las comisiones aprobadas se consideren como gastos en los reportes financieros.

## 🏗️ Arquitectura del Sistema

### **Base de Datos**
- **Tabla**: `comisiones_mecanicos`
- **Campos nuevos**:
  - `estado_comision`: ENUM('PENDIENTE', 'APROBADA', 'PENALIZADA')
  - `quincena`: VARCHAR(7) - Formato: YYYY-Q1, YYYY-Q2

### **Estados de Comisión**
1. **`PENDIENTE`**: Comisión generada, esperando decisión del cliente
2. **`APROBADA`**: Cliente aprueba el pago de la comisión
3. **`PENALIZADA`**: Cliente decide no pagar la comisión

### **Sistema de Quincenas**
- **Q1**: Días 1-15 del mes
- **Q2**: Días 16-31 del mes
- **Formato**: YYYY-Q1, YYYY-Q2 (ejemplo: 2025-Q1)

## 🚀 Funcionalidades

### **1. Generación Automática de Estados**
- Sistema asigna automáticamente `estado_comision = 'PENDIENTE'`
- Calcula automáticamente la `quincena` basándose en `fecha_calculo`
- Endpoint: `POST /trabajos/comisiones/generar-quincena/{quincena}`

### **2. Gestión de Estados**
- Cliente puede cambiar estado de `PENDIENTE` a `APROBADA` o `PENALIZADA`
- Endpoint: `PUT /trabajos/comisiones/{id_comision}/estado`

### **3. Consulta por Quincena**
- Obtener todas las comisiones de una quincena específica
- Endpoint: `GET /trabajos/comisiones/quincena/{quincena}`

### **4. Reportes Financieros**
- Solo comisiones `APROBADAS` se consideran como gastos
- Comisiones `PENALIZADAS` se muestran como ahorro
- Endpoint: `GET /trabajos/comisiones/reporte-financiero/{quincena}`

## 📱 Interfaz de Usuario

### **Sección de Comisiones por Quincena**
- Selector de quincena (YYYY-Q1, YYYY-Q2)
- Botón para generar estados automáticamente
- Lista de comisiones con acciones según estado
- Reporte financiero con resumen de la quincena

### **Acciones por Estado**
- **PENDIENTE**: Botones "Aprobar" y "Penalizar"
- **APROBADA**: Botón "Cambiar a Penalizada"
- **PENALIZADA**: Botón "Cambiar a Aprobada"

## 🔧 Implementación Técnica

### **Backend (FastAPI)**

#### **Modelo Actualizado**
```python
class ComisionMecanico(Base):
    __tablename__ = "comisiones_mecanicos"
    
    # ... campos existentes ...
    estado_comision = Column(Enum(EstadoComision), default=EstadoComision.PENDIENTE)
    quincena = Column(String(7), nullable=True)
```

#### **Funciones de Utilidad**
```python
def calcular_quincena(fecha: datetime) -> str:
    """Calcula la quincena de una fecha dada"""
    if fecha.day <= 15:
        return f"{fecha.year}-Q1"
    else:
        return f"{fecha.year}-Q2"

def obtener_fechas_quincena(quincena: str) -> tuple[datetime, datetime]:
    """Obtiene las fechas de inicio y fin de una quincena"""
    # ... implementación ...
```

#### **Nuevas Rutas API**
- `POST /trabajos/comisiones/generar-quincena/{quincena}`
- `GET /trabajos/comisiones/quincena/{quincena}`
- `PUT /trabajos/comisiones/{id_comision}/estado`
- `GET /trabajos/comisiones/reporte-financiero/{quincena}`

### **Frontend (React/TypeScript)**

#### **Componente Principal**
- `mechanics-section.tsx` - Sección expandida con gestión de comisiones
- Estado local para comisiones y reportes
- Funciones para cambiar estados y generar reportes

#### **Estados de React**
```typescript
const [showComisionesSection, setShowComisionesSection] = useState(false);
const [quincenaSeleccionada, setQuincenaSeleccionada] = useState("");
const [comisionesQuincena, setComisionesQuincena] = useState<ComisionQuincena[]>([]);
const [reporteFinanciero, setReporteFinanciero] = useState<ReporteFinanciero | null>(null);
```

## 📊 Flujo de Trabajo

### **1. Generación de Comisiones**
```
Trabajo creado → Comisión calculada → Estado: PENDIENTE → Quincena asignada
```

### **2. Revisión del Cliente**
```
Comisión PENDIENTE → Cliente decide → Estado: APROBADA o PENALIZADA
```

### **3. Reportes Financieros**
```
Comisiones APROBADAS → Gastos reales
Comisiones PENALIZADAS → Ahorro (no afecta gastos)
```

## 🗄️ Migración de Datos

### **Script SQL de Migración**
```sql
-- Actualizar comisiones existentes
UPDATE comisiones_mecanicos 
SET estado_comision = 'APROBADA'
WHERE estado_comision IS NULL;

-- Asignar quincenas
UPDATE comisiones_mecanicos 
SET quincena = CASE 
    WHEN DAY(fecha_calculo) <= 15 THEN CONCAT(YEAR(fecha_calculo), '-Q1')
    ELSE CONCAT(YEAR(fecha_calculo), '-Q2')
    END
WHERE quincena IS NULL;
```

### **Verificación Post-Migración**
```sql
-- Verificar integridad
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN estado_comision IS NOT NULL THEN 1 END) as con_estado,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena
FROM comisiones_mecanicos;
```

## 🔍 Casos de Uso

### **Caso 1: Nueva Quincena**
1. Cliente selecciona quincena (ej: 2025-Q1)
2. Sistema genera estados automáticamente
3. Todas las comisiones quedan en estado `PENDIENTE`
4. Cliente revisa y decide cuáles aprobar/penalizar

### **Caso 2: Edición de Trabajo**
1. Cliente edita orden de trabajo
2. Sistema recalcula comisiones automáticamente
3. Nuevas comisiones quedan en estado `PENDIENTE`
4. Comisiones eliminadas se marcan como `PENALIZADA`

### **Caso 3: Reporte Financiero**
1. Cliente solicita reporte de quincena
2. Sistema muestra solo comisiones `APROBADAS` como gastos
3. Comisiones `PENALIZADAS` se muestran como ahorro
4. Total de gastos = Suma de comisiones aprobadas

## 🚨 Consideraciones Importantes

### **Seguridad**
- Solo usuarios autorizados pueden cambiar estados
- Estados no se pueden revertir (solo cambiar entre APROBADA/PENALIZADA)
- Historial de cambios se mantiene en logs

### **Rendimiento**
- Índices en `estado_comision` y `quincena`
- Consultas optimizadas para reportes por quincena
- Paginación para listas grandes de comisiones

### **Integridad de Datos**
- Validación de formato de quincena (YYYY-Q1, YYYY-Q2)
- Estados válidos: PENDIENTE, APROBADA, PENALIZADA
- Comisiones sin estado se asignan automáticamente como PENDIENTE

## 🔄 Mantenimiento

### **Tareas Periódicas**
- Generar estados para nuevas quincenas
- Verificar integridad de datos
- Limpiar comisiones antiguas (opcional)

### **Monitoreo**
- Logs de cambios de estado
- Métricas de comisiones por quincena
- Alertas para comisiones sin estado

## 📈 Beneficios del Sistema

1. **Control Total**: Cliente decide qué comisiones pagar
2. **Reportes Precisos**: Solo comisiones aprobadas afectan gastos
3. **Flexibilidad**: Sistema simple sin justificaciones complejas
4. **Auditoría**: Historial completo de decisiones
5. **Automatización**: Estados se generan automáticamente

## 🆘 Solución de Problemas

### **Error: "Formato de quincena inválido"**
- Verificar formato: debe ser YYYY-Q1 o YYYY-Q2
- Ejemplo correcto: 2025-Q1

### **Error: "Estado inválido"**
- Estados válidos: APROBADA, PENALIZADA
- No se puede cambiar desde PENDIENTE directamente

### **Comisiones no aparecen**
- Verificar que se haya generado el estado para la quincena
- Usar endpoint `/generar-quincena/{quincena}` primero

## 🔮 Futuras Mejoras

1. **Notificaciones**: Alertas cuando comisiones estén pendientes
2. **Aprobación Masiva**: Aprobar/penalizar múltiples comisiones
3. **Plantillas**: Estados predefinidos para situaciones comunes
4. **Integración**: Conectarse con sistemas de nómina
5. **Analytics**: Tendencias de aprobación/penalización

---

**Desarrollado para Auto Andrade**  
**Versión**: 1.0  
**Fecha**: Enero 2025
