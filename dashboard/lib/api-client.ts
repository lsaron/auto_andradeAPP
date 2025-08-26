// API Client with proper error handling and type safety
import type { AsignacionMecanico } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, any>,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        errorData.details,
      )
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError("Network error or server unavailable", 0)
  }
}

// Types declaration
type Client = {
  id: string
  name: string
  email: string
}

type Car = {
  id: string
  make: string
  model: string
  year: number
  ownerId: string
}

type WorkOrder = {
  id: string
  carId: string
  clientId: string
  description: string
  status: string
  date: string
}

type MonthlyReport = {
  totalWorkOrders: number
  totalIncome: number
}

type SearchResult = {
  clients: Client[]
  cars: Car[]
  workOrders: WorkOrder[]
}

type OwnershipHistory = {
  carId: string
  ownerId: string
  startDate: string
  endDate: string
}

type ApiResponse<T> = {
  data: T
  error?: string
}

type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total_pages: number
    total_count: number
  }
}

type ClientCreate = {
  name: string
  email: string
}

type ClientUpdate = {
  name?: string
  email?: string
}

type CarCreate = {
  make: string
  model: string
  year: number
  ownerId: string
}

type CarUpdate = {
  make?: string
  model?: string
  year?: number
  ownerId?: string
}

type WorkOrderCreate = {
  carId: string
  clientId: string
  description: string
  status: string
  date: string
}

type WorkOrderUpdate = {
  description?: string
  status?: string
  date?: string
}

// API Client object with all endpoints
export const apiClient = {
  // Client endpoints
  clients: {
    getAll: (params?: { page?: number; per_page?: number; search?: string }) =>
      apiRequest<PaginatedResponse<Client>>(`/clients${params ? `?${new URLSearchParams(params as any)}` : ""}`),

    getById: (id: string) => apiRequest<ApiResponse<Client>>(`/clients/${id}`),

    create: (data: ClientCreate) =>
      apiRequest<ApiResponse<Client>>("/clients", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: ClientUpdate) =>
      apiRequest<ApiResponse<Client>>(`/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest<ApiResponse<null>>(`/clients/${id}`, {
        method: "DELETE",
      }),
  },

  // Car endpoints
  cars: {
    getAll: (params?: { page?: number; per_page?: number; search?: string }) =>
      apiRequest<PaginatedResponse<Car>>(`/cars${params ? `?${new URLSearchParams(params as any)}` : ""}`),

    getById: (id: string) => apiRequest<ApiResponse<Car>>(`/cars/${id}`),

    getByOwnerId: (ownerId: string) => apiRequest<ApiResponse<Car[]>>(`/cars/owner/${ownerId}`),

    create: (data: CarCreate) =>
      apiRequest<ApiResponse<Car>>("/cars", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: CarUpdate) =>
      apiRequest<ApiResponse<Car>>(`/cars/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest<ApiResponse<null>>(`/cars/${id}`, {
        method: "DELETE",
      }),
  },

  // Work Order endpoints
  workOrders: {
    getAll: (params?: { page?: number; per_page?: number; month?: string }) =>
      apiRequest<PaginatedResponse<WorkOrder>>(`/work-orders${params ? `?${new URLSearchParams(params as any)}` : ""}`),

    getById: (id: string) => apiRequest<ApiResponse<WorkOrder>>(`/work-orders/${id}`),

    getByCarId: (carId: string) => apiRequest<ApiResponse<WorkOrder[]>>(`/work-orders/car/${carId}`),

    getByClientId: (clientId: string) => apiRequest<ApiResponse<WorkOrder[]>>(`/work-orders/client/${clientId}`),

    create: (data: WorkOrderCreate) =>
      apiRequest<ApiResponse<WorkOrder>>("/work-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: WorkOrderUpdate) =>
      apiRequest<ApiResponse<WorkOrder>>(`/work-orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest<ApiResponse<null>>(`/work-orders/${id}`, {
        method: "DELETE",
      }),
  },

  // Reports endpoints
  reports: {
    getMonthlyReport: (year: number, month: number) =>
      apiRequest<ApiResponse<MonthlyReport>>(`/reports/monthly/${year}/${month}`),

    getWorkOrdersReport: (year: number, month: number) =>
      apiRequest<ApiResponse<WorkOrder[]>>(`/reports/work-orders/${year}/${month}`),

    getDashboardStats: () =>
      apiRequest<
        ApiResponse<{
          total_clients: number
          total_cars: number
          total_work_orders: number
          monthly_income: number
        }>
      >("/reports/dashboard"),
  },

  // Search endpoints
  search: {
    global: (query: string) => apiRequest<ApiResponse<SearchResult>>(`/search?q=${encodeURIComponent(query)}`),
  },

  // Ownership history endpoints
  ownershipHistory: {
    getByCarId: (carId: string) => apiRequest<ApiResponse<OwnershipHistory[]>>(`/ownership-history/car/${carId}`),
  },
}

export { ApiError }

// Mecánicos API
export const mecanicosApi = {
  // Obtener todos los mecánicos
  getAll: async (): Promise<Mechanic[]> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/`)
    if (!response.ok) throw new Error('Error al obtener mecánicos')
    return response.json()
  },

  // Obtener mecánico por ID
  getById: async (id: number): Promise<Mechanic> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/${id}`)
    if (!response.ok) throw new Error('Error al obtener mecánico')
    return response.json()
  },

  // Crear nuevo mecánico
  create: async (data: MechanicCreate): Promise<Mechanic> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al crear mecánico')
    return response.json()
  },

  // Actualizar mecánico
  update: async (id: number, data: Partial<MechanicCreate>): Promise<Mechanic> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al actualizar mecánico')
    return response.json()
  },

  // Eliminar mecánico
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Error al eliminar mecánico')
  },

  // Asignar mecánicos a un trabajo
  assignToWork: async (trabajoId: number, mecanicos: AsignacionMecanico[]): Promise<any> => {
    console.log("🚨🚨🚨 API CLIENT: Llamando a assignToWork")
    console.log("🔍 Trabajo ID:", trabajoId)
    console.log("🔍 Mecánicos:", mecanicos)
    
    const response = await fetch(`${API_BASE_URL}/mecanicos/trabajos/${trabajoId}/asignar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mecanicos),
    })
    
    console.log("🔍 Status de la respuesta:", response.status)
    console.log("🔍 Headers de la respuesta:", response.headers)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Error en la respuesta:", errorText)
      throw new Error(`Error al asignar mecánicos: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log("✅ Resultado de asignación:", result)
    return result
  },

  // Buscar mecánicos
  search: async (query: string): Promise<Mechanic[]> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/buscar/?q=${encodeURIComponent(query)}`)
    if (!response.ok) throw new Error('Error al buscar mecánicos')
    return response.json()
  },

  // Obtener estadísticas de mecánico
  getStats: async (id: number, month?: string): Promise<MechanicConEstadisticas> => {
    const url = month 
      ? `${API_BASE_URL}/mecanicos/${id}/estadisticas?mes=${month}`
      : `${API_BASE_URL}/mecanicos/${id}/estadisticas`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Error al obtener estadísticas')
    return response.json()
  },

  // Obtener reporte mensual
  getMonthlyReport: async (month: string): Promise<MechanicConEstadisticas[]> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/reporte/mensual/${month}`)
    if (!response.ok) throw new Error('Error al obtener reporte mensual')
    return response.json()
  },

  // Asignar mecánicos a trabajo
  assignToWork: async (workId: number, mechanics: AsignacionMecanico[]): Promise<AsignacionMecanicoResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/trabajos/${workId}/asignar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mechanics),
    })
    if (!response.ok) throw new Error('Error al asignar mecánicos')
    return response.json()
  },

  // Cambiar estado de comisión
  cambiarEstadoComision: async (mecanicoId: number, comisionId: number, nuevoEstado: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/${mecanicoId}/comisiones/${comisionId}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevo_estado: nuevoEstado }),
    })
    if (!response.ok) throw new Error('Error al cambiar estado de comisión')
    return response.json()
  },

  // Obtener comisiones por quincena
  getComisionesQuincena: async (mecanicoId: number, quincena: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/mecanicos/${mecanicoId}/comisiones/quincena/${quincena}`)
    if (!response.ok) throw new Error('Error al obtener comisiones de quincena')
    return response.json()
  },
}
