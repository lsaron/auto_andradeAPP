// API Client with proper error handling and type safety
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
