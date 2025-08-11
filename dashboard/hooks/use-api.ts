"use client"

// Custom hooks for API calls with loading and error states
import { useState, useEffect, useCallback } from "react"
import { apiClient, ApiError } from "@/lib/api-client"

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

interface UseApiListState<T> {
  data: T[]
  loading: boolean
  error: ApiError | null
  total: number
  page: number
  totalPages: number
}

// Generic hook for single API calls
export function useApi<T>(
  apiCall: () => Promise<{ data: T }>,
  dependencies: any[] = [],
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await apiCall()
      setState({ data: response.data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof ApiError ? error : new ApiError("Unknown error", 0),
      })
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...state, refetch: fetchData }
}

// Hook for paginated API calls
export function useApiList<T>(
  apiCall: (params?: any) => Promise<{ data: T[]; total: number; page: number; total_pages: number }>,
  initialParams: any = {},
): UseApiListState<T> & { refetch: (params?: any) => Promise<void> } {
  const [state, setState] = useState<UseApiListState<T>>({
    data: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    totalPages: 0,
  })

  const fetchData = useCallback(async (params = initialParams) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await apiCall(params)
      setState({
        data: response.data,
        loading: false,
        error: null,
        total: response.total,
        page: response.page,
        totalPages: response.total_pages,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof ApiError ? error : new ApiError("Unknown error", 0),
      }))
    }
  }, [])

  useEffect(() => {
    fetchData(initialParams)
  }, [])

  return { ...state, refetch: fetchData }
}

// Specific hooks for each entity
export function useClients(params?: { page?: number; per_page?: number; search?: string }) {
  return useApiList(apiClient.clients.getAll, params)
}

export function useClient(id: string) {
  return useApi(() => apiClient.clients.getById(id), [id])
}

export function useCars(params?: { page?: number; per_page?: number; search?: string }) {
  return useApiList(apiClient.cars.getAll, params)
}

export function useCar(id: string) {
  return useApi(() => apiClient.cars.getById(id), [id])
}

export function useWorkOrders(params?: { page?: number; per_page?: number; month?: string }) {
  return useApiList(apiClient.workOrders.getAll, params)
}

export function useWorkOrder(id: string) {
  return useApi(() => apiClient.workOrders.getById(id), [id])
}

export function useMonthlyReport(year: number, month: number) {
  return useApi(() => apiClient.reports.getMonthlyReport(year, month), [year, month])
}

export function useDashboardStats() {
  return useApi(() => apiClient.reports.getDashboardStats())
}

// Mutation hooks
export function useCreateClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const createClient = async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.clients.create(data)
      setLoading(false)
      return response.data
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError("Unknown error", 0)
      setError(apiError)
      setLoading(false)
      throw apiError
    }
  }

  return { createClient, loading, error }
}

export function useCreateCar() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const createCar = async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.cars.create(data)
      setLoading(false)
      return response.data
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError("Unknown error", 0)
      setError(apiError)
      setLoading(false)
      throw apiError
    }
  }

  return { createCar, loading, error }
}

export function useCreateWorkOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const createWorkOrder = async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.workOrders.create(data)
      setLoading(false)
      return response.data
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError("Unknown error", 0)
      setError(apiError)
      setLoading(false)
      throw apiError
    }
  }

  return { createWorkOrder, loading, error }
}
