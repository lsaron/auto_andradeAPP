# Sistema de Reset Mensual Automático - Auto Andrade

## Descripción General

El sistema de reset mensual automático está diseñado para mantener el dashboard limpio y enfocado en el mes actual, mientras preserva todo el historial en la base de datos. Esto permite que cada lunes de inicio de mes, todos los componentes se muestren desde cero, facilitando el análisis del nuevo período.

## Características Principales

### ✅ **Preservación de Historial**
- **Todos los datos se mantienen** en la base de datos
- **Acceso completo al historial** de meses anteriores
- **Reportes históricos** disponibles en cualquier momento

### ✅ **Reset Automático**
- **Reset automático** cada lunes de inicio de mes
- **Reset manual** disponible cuando sea necesario
- **Configuración flexible** del día y hora de reset

### ✅ **Componentes Integrados**
- Dashboard principal
- Reportes financieros
- Trabajos y órdenes
- Mecánicos y comisiones
- Gastos del taller
- Clientes y vehículos

## Cómo Funciona

### 1. **Detección Automática**
```typescript
// El sistema verifica automáticamente:
- Si es un nuevo mes
- Si es lunes de inicio de mes
- Si es el día configurado para reset
```

### 2. **Proceso de Reset**
```typescript
// Cuando se detecta que debe hacer reset:
1. Limpia todos los datos del frontend
2. Resetea el mes seleccionado al mes actual
3. Recarga datos del nuevo mes
4. Mantiene la base de datos intacta
```

### 3. **Preservación de Datos**
```typescript
// Los datos NO se eliminan:
- Trabajos históricos
- Comisiones de meses anteriores
- Gastos del taller
- Pagos de salarios
- Clientes y vehículos
```

## Configuración

### Archivo de Configuración
```typescript
// dashboard/config/monthly-reset-config.ts
export const MONTHLY_RESET_CONFIG = {
  ENABLED: true,           // Habilitar/deshabilitar sistema
  RESET_DAY: 1,            // Día del mes para reset (1 = primer día)
  RESET_HOUR: 0,           // Hora del día (0 = medianoche)
  PRESERVE_HISTORY: true,  // Preservar historial en BD
  SHOW_RESET_BANNER: true, // Mostrar banner informativo
  ALLOW_MANUAL_RESET: true // Permitir reset manual
}
```

### Personalización
```typescript
// Puedes configurar:
- Día específico del mes para reset
- Hora específica del día
- Componentes que se resetean
- Mensajes personalizados
- Fechas especiales (fin de año, etc.)
```

## Componentes del Sistema

### 1. **Hook useMonthlyReset**
```typescript
// Hook principal que maneja toda la lógica
const {
  isNewMonth,
  shouldReset,
  executeReset,
  checkNewMonth
} = useMonthlyReset({
  autoReset: true,
  resetDay: 1,
  preserveHistory: true
})
```

### 2. **Banner de Reset**
```typescript
// Componente que muestra información sobre el próximo reset
<MonthlyResetBanner 
  showCountdown={true}
  showResetButton={true}
  className="mb-4"
/>
```

### 3. **Eventos del Sistema**
```typescript
// Evento disparado cuando se ejecuta un reset
window.addEventListener('monthlyReset', (event) => {
  const { resetDate, month, year } = event.detail
  // Manejar el reset en tu componente
})
```

## Implementación en Componentes

### Dashboard Principal
```typescript
// dashboard/app/components/dashboard-content.tsx
export function DashboardContent() {
  const { isNewMonth, shouldReset, executeReset } = useMonthlyReset()
  
  // Efecto para manejar reset automático
  useEffect(() => {
    if (shouldReset || isNewMonth) {
      resetDashboardData()
    }
  }, [shouldReset, isNewMonth])
}
```

### Reportes
```typescript
// dashboard/app/components/reports-section.tsx
export function ReportsSection() {
  const { shouldReset, isNewMonth } = useMonthlyReset()
  
  // Efecto para resetear reportes
  useEffect(() => {
    if (shouldReset || isNewMonth) {
      // Resetear a mes actual
      const now = new Date()
      setSelectedYear(now.getFullYear().toString())
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
      
      // Limpiar datos localmente
      setMonthlyReports([])
      setWorkOrdersReport([])
      // ... otros estados
    }
  }, [shouldReset, isNewMonth])
}
```

## Flujo de Trabajo

### **Cada Lunes de Inicio de Mes:**
1. **Sistema detecta** que es lunes de inicio de mes
2. **Ejecuta reset automático** de todos los componentes
3. **Limpia datos del frontend** (no de la base de datos)
4. **Establece mes actual** como período seleccionado
5. **Recarga datos** del nuevo mes
6. **Muestra dashboard limpio** para el nuevo período

### **Durante el Mes:**
- **Acceso completo** a datos del mes actual
- **Banner informativo** sobre próximo reset
- **Contador regresivo** hasta el próximo reset
- **Botón de reset manual** disponible

### **Preservación de Datos:**
- **Base de datos intacta** con todo el historial
- **Reportes históricos** accesibles
- **Análisis de tendencias** disponibles
- **Auditoría completa** de operaciones

## Beneficios

### 🎯 **Enfoque en el Presente**
- Dashboard siempre muestra el mes actual
- Sin distracciones de meses anteriores
- Análisis más claro del período actual

### 📊 **Historial Completo**
- Acceso a todos los datos históricos
- Reportes de cualquier mes
- Análisis de tendencias a largo plazo

### ⚡ **Automatización**
- Sin intervención manual requerida
- Reset consistente y predecible
- Configuración flexible según necesidades

### 🔄 **Flexibilidad**
- Reset manual cuando sea necesario
- Configuración personalizable
- Integración con todos los componentes

## Monitoreo y Debugging

### Logs del Sistema
```typescript
// El sistema genera logs detallados:
🔄 Reset mensual detectado - Limpiando dashboard
🔄 Lunes de inicio de mes detectado - Ejecutando reset automático
🔄 Reset manual ejecutado - Limpiando dashboard
```

### Eventos del Navegador
```typescript
// Evento personalizado disparado en cada reset:
window.dispatchEvent(new CustomEvent('monthlyReset', {
  detail: {
    resetDate: new Date(),
    month: currentMonth,
    year: currentYear
  }
}))
```

### Estado del Sistema
```typescript
// Estado disponible en cada componente:
{
  currentMonth: 0,        // Mes actual (0-11)
  currentYear: 2025,      // Año actual
  lastResetDate: Date,    // Fecha del último reset
  isNewMonth: boolean,    // Si es un nuevo mes
  shouldReset: boolean    // Si se debe hacer reset
}
```

## Solución de Problemas

### **El reset no se ejecuta automáticamente:**
1. Verificar que `MONTHLY_RESET_CONFIG.ENABLED = true`
2. Verificar que la fecha actual sea lunes de inicio de mes
3. Revisar logs del navegador para errores

### **Los datos no se limpian:**
1. Verificar que el componente use el hook `useMonthlyReset`
2. Verificar que los `useEffect` estén correctamente configurados
3. Verificar que los estados se estén limpiando correctamente

### **El banner no se muestra:**
1. Verificar que `SHOW_RESET_BANNER = true`
2. Verificar que el componente esté incluido en el JSX
3. Verificar que la lógica de visibilidad esté funcionando

## Personalización Avanzada

### **Fechas Especiales**
```typescript
SPECIAL_DATES: {
  ENABLE_SPECIAL_RESETS: true,
  ADDITIONAL_RESET_DATES: [
    "2025-12-31", // Reset de fin de año
    "2025-06-30", // Reset de mitad de año
  ]
}
```

### **Componentes Selectivos**
```typescript
COMPONENTS: {
  DASHBOARD: true,    // Resetear dashboard
  REPORTS: false,     // NO resetear reportes
  WORK_ORDERS: true,  // Resetear trabajos
  // ... otros componentes
}
```

### **Mensajes Personalizados**
```typescript
MESSAGES: {
  RESET_SUCCESS: "¡Dashboard renovado para el nuevo mes!",
  RESET_WARNING: "Atención: Reset automático en {time}",
  RESET_INFO: "Los datos históricos permanecen seguros"
}
```

## Conclusión

El sistema de reset mensual automático proporciona una solución elegante para mantener el dashboard enfocado en el presente mientras preserva todo el historial. Es completamente configurable, se integra con todos los componentes existentes, y funciona de manera transparente para el usuario final.

**Características clave:**
- ✅ **Automático y confiable**
- ✅ **Preserva todo el historial**
- ✅ **Fácil de configurar**
- ✅ **Integrado en todos los componentes**
- ✅ **Flexible y personalizable**

Para cualquier pregunta o personalización adicional, consulta la configuración en `dashboard/config/monthly-reset-config.ts` o modifica la lógica en los componentes individuales.
