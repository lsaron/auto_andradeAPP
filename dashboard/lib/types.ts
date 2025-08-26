// Updated TypeScript interfaces without status fields
export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  registration_date: string
  total_spent: number
  vehicle_count?: number
  created_at: string
  updated_at: string
}

export interface ClientCreate {
  name: string
  email: string
  phone: string
  address: string
}

export interface ClientUpdate {
  name?: string
  email?: string
  phone?: string
  address?: string
}

export interface Car {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number
  color?: string
  vin?: string
  owner_id: string
  owner_name?: string
  registration_date: string
  mileage?: number
  created_at: string
  updated_at: string
}

export interface CarCreate {
  license_plate: string
  brand: string
  model: string
  year: number
  color?: string
  vin?: string
  owner_id: string
  mileage?: number
}

export interface CarUpdate {
  license_plate?: string
  brand?: string
  model?: string
  year?: number
  color?: string
  vin?: string
  owner_id?: string
  mileage?: number
}

export interface WorkOrder {
  id: string
  car_id: string
  client_id: string
  license_plate?: string
  client_name?: string
  description: string
  total_cost: number
  expenses: number
  profit: number
  date: string
  mechanic_name?: string
  parts?: string[]
  labor_hours?: number
  created_at: string
  updated_at: string
}

export interface WorkOrderCreate {
  car_id: string
  client_id: string
  description: string
  total_cost: number
  expenses: number
  mechanic_name?: string
  parts?: string[]
  labor_hours?: number
}

export interface WorkOrderUpdate {
  description?: string
  total_cost?: number
  expenses?: number
  mechanic_name?: string
  parts?: string[]
  labor_hours?: number
}
export interface Mechanic {
  id: string
  name: string
  mechanic_id: string
  jobs_completed: number
  total_commission: number
  total_profit: number
  hire_date: string
  created_at: string
  updated_at: string
  comision_estado?: string // Estado de la comisión: PENDIENTE, APROBADA, DENEGADA
}

export interface MechanicCreate {
  name: string
}

export interface MechanicUpdate {
  name?: string
}

// Nuevos tipos para mecánicos y comisiones
export interface MecanicoConEstadisticas extends Mechanic {
  trabajos_completados: number
  total_ganancias: number
  total_comisiones: number
}

export interface AsignacionMecanico {
  id_mecanico: number
  porcentaje_comision?: number
}

export interface AsignacionMecanicoResponse {
  id_trabajo: number
  id_mecanico: number
  nombre_mecanico: string
  porcentaje_comision: number
  monto_comision: number
  ganancia_trabajo: number
}


export interface MonthlyReport {
  month: string
  year: number
  total_income: number
  total_expenses: number
  net_profit: number
  work_order_count: number
  average_income: number
  average_expenses: number
  profit_margin: number
}

export interface SearchResult {
  clients: Client[]
  cars: Car[]
  total_clients: number
  total_cars: number
}

export interface OwnershipHistory {
  id: string
  car_id: string
  owner_id: string
  owner_name: string
  start_date: string
  end_date?: string
  transfer_reason?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// Error types
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, any>
}
