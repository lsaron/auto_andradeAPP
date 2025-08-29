// Configuración del sistema de reset mensual automático
export const MONTHLY_RESET_CONFIG = {
  // Configuración general
  ENABLED: true,
  
  // Día del mes para el reset (1 = primer día del mes)
  RESET_DAY: 1,
  
  // Hora del día para el reset (0-23, 0 = medianoche)
  RESET_HOUR: 0,
  
  // Minuto del día para el reset (0-59)
  RESET_MINUTE: 0,
  
  // Si se debe preservar el historial en la base de datos
  PRESERVE_HISTORY: true,
  
  // Si se debe mostrar el banner de reset
  SHOW_RESET_BANNER: true,
  
  // Si se debe permitir reset manual
  ALLOW_MANUAL_RESET: true,
  
  // Días antes del reset para mostrar el banner de advertencia
  BANNER_WARNING_DAYS: 3,
  
  // Intervalo de verificación en milisegundos (1 minuto = 60000)
  CHECK_INTERVAL: 60000,
  
  // Intervalo de verificación para lunes de inicio de mes (1 hora = 3600000)
  MONDAY_CHECK_INTERVAL: 3600000,
  
  // Configuración de notificaciones
  NOTIFICATIONS: {
    ENABLED: true,
    SHOW_SUCCESS: true,
    SHOW_WARNING: true,
    AUTO_HIDE_DELAY: 5000, // 5 segundos
  },
  
  // Configuración de componentes que se resetean
  COMPONENTS: {
    DASHBOARD: true,
    REPORTS: true,
    WORK_ORDERS: true,
    MECHANICS: true,
    TALLER: true,
    CLIENTS: true,
    CARS: true,
  },
  
  // Mensajes personalizados
  MESSAGES: {
    RESET_SUCCESS: "Dashboard reseteado exitosamente para el nuevo mes",
    RESET_WARNING: "El dashboard se reseteará automáticamente en {time}",
    RESET_INFO: "Los datos se mantienen en la base de datos para el historial",
    MANUAL_RESET_CONFIRM: "¿Estás seguro de que quieres ejecutar el reset mensual ahora?",
    MANUAL_RESET_SUCCESS: "Reset manual ejecutado exitosamente",
  },
  
  // Configuración de fechas especiales
  SPECIAL_DATES: {
    // Si se debe hacer reset en fechas especiales (como fin de año)
    ENABLE_SPECIAL_RESETS: false,
    // Fechas específicas para reset adicional
    ADDITIONAL_RESET_DATES: [
      // Formato: "YYYY-MM-DD"
      // "2025-12-31", // Reset de fin de año
    ],
  },
  
  // Configuración de logging
  LOGGING: {
    ENABLED: true,
    LEVEL: "INFO", // DEBUG, INFO, WARN, ERROR
    SHOW_CONSOLE: true,
    SHOW_BROWSER_CONSOLE: true,
  },
  
  // Configuración de persistencia
  PERSISTENCE: {
    // Si se debe guardar la fecha del último reset en localStorage
    SAVE_LAST_RESET: true,
    // Si se debe guardar el estado del reset en localStorage
    SAVE_RESET_STATE: true,
    // Clave para localStorage
    STORAGE_KEY: "auto_andrade_monthly_reset",
  },
}

// Función helper para obtener la configuración
export function getMonthlyResetConfig() {
  return MONTHLY_RESET_CONFIG
}

// Función helper para verificar si el reset está habilitado
export function isMonthlyResetEnabled() {
  return MONTHLY_RESET_CONFIG.ENABLED
}

// Función helper para obtener el día de reset
export function getResetDay() {
  return MONTHLY_RESET_CONFIG.RESET_DAY
}

// Función helper para verificar si se debe preservar el historial
export function shouldPreserveHistory() {
  return MONTHLY_RESET_CONFIG.PRESERVE_HISTORY
}

// Función helper para verificar si se debe mostrar el banner
export function shouldShowResetBanner() {
  return MONTHLY_RESET_CONFIG.SHOW_RESET_BANNER
}

// Función helper para verificar si se permite reset manual
export function allowManualReset() {
  return MONTHLY_RESET_CONFIG.ALLOW_MANUAL_RESET
}
