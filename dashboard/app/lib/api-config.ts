// Configuración de la API del backend
export const API_CONFIG = {
  // URL base de la API del backend
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  
  // Endpoints específicos
  ENDPOINTS: {
    // Gastos del taller
    GASTOS_TALLER: '/gastos-taller',
    
    // Pagos de salarios
    PAGOS_SALARIOS: '/pagos-salarios',
    
    // Mecánicos
    MECANICOS: '/mecanicos',
    
    // Clientes
    CLIENTES: '/clientes',
    
    // Carros
    CARROS: '/carros',
    
    // Trabajos
    TRABAJOS: '/trabajos',
    
    // Reportes
    REPORTES: '/reportes',
    
    // Autenticación
    AUTH: '/auth'
  }
}

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// Función helper para manejar errores de la API
export const handleApiError = (response: Response): never => {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`)
}

// Función helper para hacer requests a la API
export const apiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = buildApiUrl(endpoint)
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }
  
  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      handleApiError(response)
    }
    
    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error de red o servidor no disponible')
  }
}
