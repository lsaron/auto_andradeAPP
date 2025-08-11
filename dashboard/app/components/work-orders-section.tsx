"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { Edit, Eye, Plus, Trash2, Search, X, Calendar, Car, DollarSign, FileText, Printer } from "lucide-react"
import Select from "react-select"

interface WorkOrder {
  id: string
  licensePlate: string
  description: string
  totalCost: number
  expenses: number
  profit: number
  date: string
  clientName: string
  clientId: string
  carId: string
  mechanicName?: string
}

interface Expense {
  id: string
  item: string
  amount: string
}

type VehicleOption = {
  value: string
  label: string
}

export function WorkOrdersSection() {
  // Pagination and loading states
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalWorkOrders, setTotalWorkOrders] = useState(0)

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Date filter functionality
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  })
  const [isDateFiltering, setIsDateFiltering] = useState(false)

  // Modal states
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Add after the existing modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editOrder, setEditOrder] = useState({
    id: "",
    description: "",
    totalCost: "",
    expenses: [] as { id: string; item: string; amount: string }[],
  })

  // Add after the existing modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<WorkOrder | null>(null)

  // Form state
  const [newOrder, setNewOrder] = useState({
    licensePlate: "",
    description: "",
    totalCost: "",
    clientName: "",
    expenses: [] as { id: string; item: string; amount: string }[],
    applyWork: false, // Add this new field
  })

  // Add function to handle expenses
  const addExpense = () => {
    const newExpense = {
      id: Date.now().toString(),
      item: "",
      amount: "",
    }
    setNewOrder({
      ...newOrder,
      expenses: [...newOrder.expenses, newExpense],
    })
  }

  const removeExpense = (id: string) => {
    setNewOrder({
      ...newOrder,
      expenses: newOrder.expenses.filter((expense) => expense.id !== id),
    })
  }

  const updateExpense = (id: string, field: "item" | "amount", value: string) => {
    setNewOrder({
      ...newOrder,
      expenses: newOrder.expenses.map((expense) => (expense.id === id ? { ...expense, [field]: value } : expense)),
    })
  }

  // Calculate total expenses automatically
  const calculateTotalExpenses = () => {
    return newOrder.expenses.reduce((total, expense) => {
      return total + (Number.parseFloat(expense.amount) || 0)
    }, 0)
  }

  // Add after the existing expense functions
  const addEditExpense = () => {
    const newExpense = {
      id: Date.now().toString(),
      item: "",
      amount: "",
    }
    setEditOrder({
      ...editOrder,
      expenses: [...editOrder.expenses, newExpense],
    })
  }

  const removeEditExpense = (id: string) => {
    setEditOrder({
      ...editOrder,
      expenses: editOrder.expenses.filter((expense) => expense.id !== id),
    })
  }

  const updateEditExpense = (id: string, field: "item" | "amount", value: string) => {
    setEditOrder({
      ...editOrder,
      expenses: editOrder.expenses.map((expense) => (expense.id === id ? { ...expense, [field]: value } : expense)),
    })
  }

  // Calculate total expenses for edit form
  const calculateEditTotalExpenses = () => {
    return editOrder.expenses.reduce((total, expense) => {
      return total + (Number.parseFloat(expense.amount) || 0)
    }, 0)
  }

  // Update the handleAddWorkOrder function
  const handleAddWorkOrder = async () => {
    if (newOrder.licensePlate && newOrder.description && newOrder.clientName && newOrder.totalCost) {
      try {
        const totalExpenses = calculateTotalExpenses()
        const totalCost = Number.parseFloat(newOrder.totalCost) || 0

        const response = await fetch("http://localhost:8000/api/trabajos/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matricula_carro: newOrder.licensePlate,
            descripcion: newOrder.description,
            fecha: new Date().toISOString().split("T")[0],
            costo: totalCost,
            aplica_iva: true,
            detalle_gastos: newOrder.expenses.map(expense => ({
              descripcion: expense.item,
              monto: Number.parseFloat(expense.amount) || 0
            }))
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Error al crear trabajo")
        }

        // Reload work orders after adding
        await loadWorkOrders(1, true)

        setNewOrder({
          licensePlate: "",
          description: "",
          totalCost: "",
          clientName: "",
          expenses: [],
          applyWork: false,
        })
        setIsNewOrderModalOpen(false)
      } catch (error: any) {
        console.error("Error al crear trabajo:", error)
        alert(error.message || "Error inesperado")
      }
    }
  }

  // Add after handleAddWorkOrder function
  const handleSaveEditOrder = async () => {
    if (editOrder.description && editOrder.totalCost) {
      try {
        const totalExpenses = calculateEditTotalExpenses()
        const totalCost = Number.parseFloat(editOrder.totalCost) || 0

        // Extract the numeric ID from the work order ID (e.g., "WO-001" -> 1)
        const workOrderId = parseInt(editOrder.id.replace("WO-", ""))

        const response = await fetch(`http://localhost:8000/api/trabajos/trabajo/${workOrderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matricula_carro: "", // Keep existing
            descripcion: editOrder.description,
            fecha: new Date().toISOString().split("T")[0],
            costo: totalCost,
            aplica_iva: true,
            detalle_gastos: editOrder.expenses.map(expense => ({
              descripcion: expense.item,
              monto: Number.parseFloat(expense.amount) || 0
            }))
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Error al actualizar trabajo")
        }

        // Reload work orders after updating
        await loadWorkOrders(1, true)

        setEditOrder({
          id: "",
          description: "",
          totalCost: "",
          expenses: [],
        })
        setIsEditModalOpen(false)
      } catch (error: any) {
        console.error("Error al actualizar trabajo:", error)
        alert(error.message || "Error inesperado")
      }
    }
  }

  const [availableCars, setAvailableCars] = useState<Array<{id: string, licensePlate: string, owner: string}>>([])
  const [availableClients, setAvailableClients] = useState<Array<{id: string, name: string}>>([])
  
  // Transform available cars to options for react-select
  const vehicleOptions: VehicleOption[] = availableCars.map((car) => ({
    value: car.licensePlate,
    label: `${car.licensePlate} - ${car.owner}`,
  }))

  // Load available cars and clients
  const loadAvailableData = async () => {
    try {
      // Load cars
      const carsResponse = await fetch("http://localhost:8000/api/carros/")
      if (carsResponse.ok) {
        const carsData = await carsResponse.json()
        const transformedCars = carsData.map((car: any) => ({
          id: car.matricula,
          licensePlate: car.matricula,
          owner: car.nombre_cliente
        }))
        setAvailableCars(transformedCars)
      }

      // Load clients
      const clientsResponse = await fetch("http://localhost:8000/api/clientes/")
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        const transformedClients = clientsData.map((client: any) => ({
          id: client.id_nacional,
          name: client.nombre
        }))
        setAvailableClients(transformedClients)
      }
    } catch (error) {
      console.error("Error loading available data:", error)
    }
  }

  // Load work orders with pagination
  const loadWorkOrders = useCallback(
    async (pageNum: number, reset = false) => {
      if (loading) return

      try {
        setLoading(true)
        setError(null)

        if (reset) {
          setInitialLoading(true)
        }

        const response = await fetch("http://localhost:8000/api/trabajos/")
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("🔧 Work orders data:", data)

        // Transform backend data to frontend format
        const transformedOrders: WorkOrder[] = data.map((trabajo: any) => ({
          id: `WO-${String(trabajo.id).padStart(3, "0")}`,
          licensePlate: trabajo.matricula_carro,
          description: trabajo.descripcion,
          totalCost: trabajo.costo,
          expenses: trabajo.total_gastos,
          profit: trabajo.ganancia,
          date: trabajo.fecha,
          clientName: trabajo.cliente_nombre,
          clientId: trabajo.cliente_id || "",
          carId: trabajo.matricula_carro,
        }))

        if (reset) {
          setWorkOrders(transformedOrders)
          setFilteredWorkOrders(transformedOrders)
        } else {
          setWorkOrders((prev) => [...prev, ...transformedOrders])
          setFilteredWorkOrders((prev) => [...prev, ...transformedOrders])
        }

        setTotalWorkOrders(transformedOrders.length)
        setHasMore(false) // No pagination for now
        setPage(pageNum)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error loading work orders"))
        if (reset) {
          setWorkOrders([])
          setFilteredWorkOrders([])
        }
      } finally {
        setLoading(false)
        if (reset) {
          setInitialLoading(false)
        }
      }
    },
    [loading],
  )

  // Search and filter functionality - updated to include date filtering
  const handleSearchAndFilter = useCallback(
    async (query: string, dateRange: { startDate: string; endDate: string }) => {
      let filtered = workOrders

      // Apply search filter
      if (query.trim()) {
        filtered = filtered.filter(
          (order) =>
            order.licensePlate.toLowerCase().includes(query.toLowerCase()) ||
            order.description.toLowerCase().includes(query.toLowerCase()) ||
            order.clientName.toLowerCase().includes(query.toLowerCase()) ||
            order.id.toLowerCase().includes(query.toLowerCase()),
        )
      }

      // Apply date filter
      if (dateRange.startDate || dateRange.endDate) {
        filtered = filtered.filter((order) => {
          const orderDate = new Date(order.date)
          const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null
          const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null

          if (startDate && orderDate < startDate) return false
          if (endDate && orderDate > endDate) return false
          return true
        })
      }

      setFilteredWorkOrders(filtered)
      setHasMore(false) // Disable infinite scroll during search/filter
      setIsSearching(false)
      setIsDateFiltering(false)
    },
    [workOrders],
  )

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim() && !dateFilter.startDate && !dateFilter.endDate) {
        setFilteredWorkOrders(workOrders)
        setHasMore(page < Math.ceil(totalWorkOrders / 10))
        setIsSearching(false)
        setIsDateFiltering(false)
        return
      }

      setIsSearching(true)
      await new Promise((resolve) => setTimeout(resolve, 200))
      handleSearchAndFilter(query, dateFilter)
    },
    [workOrders, page, totalWorkOrders, dateFilter, handleSearchAndFilter],
  )

  const handleDateFilter = useCallback(
    async (dateRange: { startDate: string; endDate: string }) => {
      if (!dateRange.startDate && !dateRange.endDate && !searchQuery.trim()) {
        setFilteredWorkOrders(workOrders)
        setHasMore(page < Math.ceil(totalWorkOrders / 10))
        setIsDateFiltering(false)
        return
      }

      setIsDateFiltering(true)
      await new Promise((resolve) => setTimeout(resolve, 200))
      handleSearchAndFilter(searchQuery, dateRange)
    },
    [workOrders, page, totalWorkOrders, searchQuery, handleSearchAndFilter],
  )

  const clearSearch = () => {
    setSearchQuery("")
    setDateFilter({ startDate: "", endDate: "" })
    setIsSearching(false)
    setIsDateFiltering(false)
    setFilteredWorkOrders(workOrders)
    setHasMore(page < Math.ceil(totalWorkOrders / 20))
  }

  // Initial load
  useEffect(() => {
    loadWorkOrders(1, true)
    loadAvailableData()
  }, []) // Remove loadWorkOrders from dependencies to prevent infinite loop

  // Search effect with debounce - updated to handle date filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, handleSearch])

  // Date filter effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleDateFilter(dateFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [dateFilter, handleDateFilter])

  // Infinite scroll handler
  const handleLoadMore = () => {
    if (!loading && hasMore && !searchQuery) {
      loadWorkOrders(page + 1)
    }
  }

  const handleViewWorkOrder = (order: WorkOrder) => {
    setSelectedWorkOrder(order)
    setIsDetailModalOpen(true)
  }

  // Add after handleViewWorkOrder function
  const handleEditWorkOrder = (order: WorkOrder) => {
    // Generate mock expenses for editing (in real app, this would come from the API)
    const mockExpenses = [
      { id: "1", item: "Aceite Repsol 5W-30", amount: (order.expenses * 0.4).toString() },
      { id: "2", item: "Filtro de aceite", amount: (order.expenses * 0.2).toString() },
      { id: "3", item: "Pastillas de freno", amount: (order.expenses * 0.3).toString() },
      { id: "4", item: "Mano de obra", amount: (order.expenses * 0.1).toString() },
    ].filter((expense) => Number.parseFloat(expense.amount) > 0)

    setEditOrder({
      id: order.id,
      description: order.description,
      totalCost: order.totalCost.toString(),
      expenses: mockExpenses,
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteWorkOrder = (order: WorkOrder) => {
    setOrderToDelete(order)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteWorkOrder = async () => {
    if (orderToDelete) {
      try {
        // Extract the numeric ID from the work order ID (e.g., "WO-001" -> 1)
        const workOrderId = parseInt(orderToDelete.id.replace("WO-", ""))

        const response = await fetch(`http://localhost:8000/api/trabajos/trabajo/${workOrderId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Error al eliminar trabajo")
        }

        // Reload work orders after deleting
        await loadWorkOrders(1, true)

        setOrderToDelete(null)
        setIsDeleteModalOpen(false)
      } catch (error: any) {
        console.error("Error al eliminar trabajo:", error)
        alert(error.message || "Error inesperado")
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold"> Trabajos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona todos los trabajos realizados en el taller
          </p>
        </div>
        <Dialog open={isNewOrderModalOpen} onOpenChange={setIsNewOrderModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Crear Trabajo</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Crear Nueva Orden de Trabajo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label htmlFor="licensePlate" className="text-sm font-medium">
                  Vehículo *
                </Label>
                <Select<VehicleOption>
                  id="licensePlate"
                  options={vehicleOptions}
                  value={vehicleOptions.find((option) => option.value === newOrder.licensePlate) || null}
                  onChange={(selected) => {
                    const selectedCar = availableCars.find((car) => car.licensePlate === selected?.value)
                    setNewOrder({
                      ...newOrder,
                      licensePlate: selected?.value || "",
                      clientName: selectedCar?.owner || "",
                    })
                  }}
                  placeholder="Buscar vehículo por placa o cliente..."
                  isClearable
                  className="w-full"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "42px",
                      fontSize: "14px",
                    }),
                  }}
                />
              </div>

              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm font-medium">
                  Cliente
                </Label>
                <Input
                  id="clientName"
                  value={newOrder.clientName}
                  onChange={(e) => setNewOrder({ ...newOrder, clientName: e.target.value })}
                  placeholder="Nombre del cliente"
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción del Trabajo *
                </Label>
                <Textarea
                  id="description"
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                  placeholder="Describe detalladamente el trabajo realizado, problemas encontrados, soluciones aplicadas, etc."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Expenses Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Gastos y Materiales</Label>
                  <Button
                    type="button"
                    onClick={addExpense}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar Gasto
                  </Button>
                </div>

                {newOrder.expenses.length > 0 && (
                  <div className="space-y-3 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                    {newOrder.expenses.map((expense, index) => (
                      <div key={expense.id} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="Ej: Aceite Repsol 5W-30"
                            value={expense.item}
                            onChange={(e) => updateExpense(expense.id, "item", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            placeholder="₡ 0.00"
                            value={expense.amount}
                            onChange={(e) => updateExpense(expense.id, "amount", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeExpense(expense.id)}
                          variant="outline"
                          size="sm"
                          className="px-2 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {/* Total Expenses Display */}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span>Total de Gastos:</span>
                        <span className="text-red-600">₡ {calculateTotalExpenses().toLocaleString("es-CR")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {newOrder.expenses.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-md">
                    <p className="text-sm text-muted-foreground">No hay gastos agregados</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Haz clic en "Agregar Gasto" para añadir materiales y costos
                    </p>
                  </div>
                )}
              </div>

              {/* Total Cost */}
              <div className="space-y-2">
                <Label htmlFor="totalCost" className="text-sm font-medium">
                  Costo Total Cobrado al Cliente *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">₡</span>
                  <Input
                    id="totalCost"
                    type="number"
                    value={newOrder.totalCost}
                    onChange={(e) => setNewOrder({ ...newOrder, totalCost: e.target.value })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>

                {/* Profit Calculation Display */}
                {newOrder.totalCost && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Costo Total:</span>
                        <span className="font-medium">
                          ₡ {Number.parseFloat(newOrder.totalCost || "0").toLocaleString("es-CR")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Gastos:</span>
                        <span className="text-red-600">₡ {calculateTotalExpenses().toLocaleString("es-CR")}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-1 border-t">
                        <span>Ganancia Estimada:</span>
                        <span
                          className={`${(Number.parseFloat(newOrder.totalCost || "0") - calculateTotalExpenses()) >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ₡{" "}
                          {(Number.parseFloat(newOrder.totalCost || "0") - calculateTotalExpenses()).toLocaleString(
                            "es-CR",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Work Status - Moved to end */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Estado del Trabajo</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="applyWork"
                    checked={newOrder.applyWork}
                    onChange={(e) => setNewOrder({ ...newOrder, applyWork: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="applyWork" className="text-sm">
                    Aplicar trabajo (marcar si el trabajo ha sido completado)
                  </Label>
                </div>
              </div>

              {/* Invoice Button - Only when work is applied */}
              {newOrder.applyWork && (
                <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-md">
                  <Label className="text-sm font-medium text-green-800">Facturación</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white hover:bg-green-50 border-green-300 text-green-700"
                    onClick={() => {
                      // TODO: Implement generate invoice functionality
                      alert("Generando factura...")
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Factura
                  </Button>
                </div>
              )}

              {/* Print Button - Always Available - Small button */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 border-gray-300"
                  onClick={() => {
                    // TODO: Implement print functionality
                    alert("Imprimiendo...")
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsNewOrderModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                onClick={handleAddWorkOrder}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                disabled={!newOrder.licensePlate || !newOrder.description || !newOrder.totalCost}
              >
                Crear Orden de Trabajo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Order Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Editar Orden de Trabajo - {editOrder.id}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="editDescription" className="text-sm font-medium">
                  Descripción del Trabajo *
                </Label>
                <Textarea
                  id="editDescription"
                  value={editOrder.description}
                  onChange={(e) => setEditOrder({ ...editOrder, description: e.target.value })}
                  placeholder="Describe detalladamente el trabajo realizado, problemas encontrados, soluciones aplicadas, etc."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Expenses Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Gastos y Materiales</Label>
                  <Button
                    type="button"
                    onClick={addEditExpense}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar Gasto
                  </Button>
                </div>

                {editOrder.expenses.length > 0 && (
                  <div className="space-y-3 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                    {editOrder.expenses.map((expense, index) => (
                      <div key={expense.id} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="Ej: Aceite Repsol 5W-30"
                            value={expense.item}
                            onChange={(e) => updateEditExpense(expense.id, "item", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            placeholder="₡ 0.00"
                            value={expense.amount}
                            onChange={(e) => updateEditExpense(expense.id, "amount", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeEditExpense(expense.id)}
                          variant="outline"
                          size="sm"
                          className="px-2 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {/* Total Expenses Display */}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span>Total de Gastos:</span>
                        <span className="text-red-600">₡ {calculateEditTotalExpenses().toLocaleString("es-CR")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {editOrder.expenses.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-md">
                    <p className="text-sm text-muted-foreground">No hay gastos agregados</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Haz clic en "Agregar Gasto" para añadir materiales y costos
                    </p>
                  </div>
                )}
              </div>

              {/* Total Cost */}
              <div className="space-y-2">
                <Label htmlFor="editTotalCost" className="text-sm font-medium">
                  Costo Total Cobrado al Cliente *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">₡</span>
                  <Input
                    id="editTotalCost"
                    type="number"
                    value={editOrder.totalCost}
                    onChange={(e) => setEditOrder({ ...editOrder, totalCost: e.target.value })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>

                {/* Profit Calculation Display */}
                {editOrder.totalCost && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Costo Total:</span>
                        <span className="font-medium">
                          ₡ {Number.parseFloat(editOrder.totalCost || "0").toLocaleString("es-CR")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Gastos:</span>
                        <span className="text-red-600">₡ {calculateEditTotalExpenses().toLocaleString("es-CR")}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-1 border-t">
                        <span>Ganancia Estimada:</span>
                        <span
                          className={`${(Number.parseFloat(editOrder.totalCost || "0") - calculateEditTotalExpenses()) >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ₡{" "}
                          {(
                            Number.parseFloat(editOrder.totalCost || "0") - calculateEditTotalExpenses()
                          ).toLocaleString("es-CR")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEditOrder}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                disabled={!editOrder.description || !editOrder.totalCost}
              >
                Guardar Cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Section */}
      <Card className="w-full">
        <CardContent className="pt-4 sm:pt-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por placa, descripción, cliente o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-base sm:text-lg h-10 sm:h-12"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {(searchQuery || dateFilter.startDate || dateFilter.endDate) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isSearching || isDateFiltering ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Filtrando...</span>
                    </>
                  ) : (
                    <span>
                      {filteredWorkOrders.length} resultado{filteredWorkOrders.length !== 1 ? "s" : ""} encontrado
                      {filteredWorkOrders.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Date Filter */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
              <Label className="text-sm font-medium whitespace-nowrap">Filtrar por fecha:</Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                  <Label htmlFor="startDate" className="text-xs text-muted-foreground whitespace-nowrap">
                    Desde:
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                    className="w-full sm:w-auto text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                  <Label htmlFor="endDate" className="text-xs text-muted-foreground whitespace-nowrap">
                    Hasta:
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                    className="w-full sm:w-auto text-sm"
                  />
                </div>
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateFilter({ startDate: "", endDate: "" })}
                    className="bg-transparent text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Search and Filter Results Summary */}
            {(searchQuery || dateFilter.startDate || dateFilter.endDate) && !(isSearching || isDateFiltering) && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="outline" className="text-xs">
                    Búsqueda: "{searchQuery}"
                  </Badge>
                )}
                {dateFilter.startDate && (
                  <Badge variant="outline" className="text-xs">
                    Desde: {new Date(dateFilter.startDate).toLocaleDateString("es-MX")}
                  </Badge>
                )}
                {dateFilter.endDate && (
                  <Badge variant="outline" className="text-xs">
                    Hasta: {new Date(dateFilter.endDate).toLocaleDateString("es-MX")}
                  </Badge>
                )}
                {filteredWorkOrders.length === 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Sin resultados
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && <ErrorMessage error={error} onRetry={() => loadWorkOrders(1, true)} />}

      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center justify-between">
            <span>Lista de Órdenes de Trabajo</span>
            <div className="text-sm font-normal text-muted-foreground">
              {searchQuery
                ? `${filteredWorkOrders.length} resultado${filteredWorkOrders.length !== 1 ? "s" : ""}`
                : `${workOrders.length} de ${totalWorkOrders} órdenes`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* Loading state for initial load */}
          {initialLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner className="mr-2" />
              <span className="text-muted-foreground">Cargando órdenes de trabajo...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <FileText className="h-12 w-12 mx-auto mb-2" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Error al cargar órdenes</h3>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => loadWorkOrders(1, true)} variant="outline" className="bg-transparent">
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {filteredWorkOrders.map((order, index) => (
                  <div
                    key={`${order.id}-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header row with ID and status */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm sm:text-base">{order.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formatDate(order.date)}
                        </div>
                      </div>

                      {/* License plate and client */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          <span className="font-medium text-sm sm:text-base">{order.licensePlate}</span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">Cliente: {order.clientName}</span>
                      </div>

                      {/* Description */}
                      <div className="flex items-start gap-2">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{order.description}</p>
                      </div>

                      {/* Cost and profit - Mobile view */}
                      <div className="flex sm:hidden justify-between items-center pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">{formatCurrency(order.totalCost)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Ganancia: {formatCurrency(order.profit)}</span>
                      </div>
                    </div>

                    {/* Desktop actions and cost */}
                    <div className="hidden sm:flex sm:items-center sm:gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(order.totalCost)}
                        </div>
                        <div className="text-xs text-muted-foreground">Ganancia: {formatCurrency(order.profit)}</div>
                      </div>
                      <div className="flex gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 bg-transparent p-1 sm:p-2 h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handleViewWorkOrder(order)}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-green-50 hover:text-green-600 bg-transparent p-1 sm:p-2 h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handleEditWorkOrder(order)}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-red-50 hover:text-red-600 bg-transparent p-1 sm:p-2 h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handleDeleteWorkOrder(order)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile actions */}
                    <div className="flex sm:hidden justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 hover:text-blue-600 bg-transparent p-1 h-7 w-7"
                        onClick={() => handleViewWorkOrder(order)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-green-50 hover:text-green-600 bg-transparent p-1 h-7 w-7"
                        onClick={() => handleEditWorkOrder(order)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-red-50 hover:text-red-600 bg-transparent p-1 h-7 w-7"
                        onClick={() => handleDeleteWorkOrder(order)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Load More Button - Only show when not searching or filtering */}
                {!searchQuery && !dateFilter.startDate && !dateFilter.endDate && hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      variant="outline"
                      className="w-full sm:w-auto bg-transparent"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Cargando más...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Cargar más órdenes ({totalWorkOrders - workOrders.length} restantes)
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* End of list message */}
                {!searchQuery && !dateFilter.startDate && !dateFilter.endDate && !hasMore && workOrders.length > 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    ✅ Se han cargado todas las {totalWorkOrders} órdenes de trabajo
                  </div>
                )}

                {/* Search/Filter results empty state */}
                {(searchQuery || dateFilter.startDate || dateFilter.endDate) &&
                  !(isSearching || isDateFiltering) &&
                  filteredWorkOrders.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No se encontraron órdenes</h3>
                      <p className="text-muted-foreground mb-4">
                        No se encontraron órdenes de trabajo que coincidan con los filtros aplicados
                      </p>
                      <Button variant="outline" onClick={clearSearch} className="bg-transparent">
                        Limpiar filtros
                      </Button>
                    </div>
                  )}

                {/* Empty state for no orders at all */}
                {!searchQuery &&
                  !dateFilter.startDate &&
                  !dateFilter.endDate &&
                  workOrders.length === 0 &&
                  !loading && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No hay órdenes de trabajo</h3>
                      <p className="text-muted-foreground mb-4">Comienza creando la primera orden de trabajo</p>
                      <Button onClick={() => setIsNewOrderModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Primera Orden
                      </Button>
                    </div>
                  )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Work Order Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5" />
              Detalles de la Orden - {selectedWorkOrder?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedWorkOrder && (
            <div className="space-y-6">
              {/* Header with status */}
              <div>
                <h3 className="text-lg font-semibold">{selectedWorkOrder.id}</h3>
                <p className="text-sm text-muted-foreground">Fecha: {formatDate(selectedWorkOrder.date)}</p>
              </div>

              {/* Vehicle and client info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Vehículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Placa:</span>
                      <span className="font-semibold">{selectedWorkOrder.licensePlate}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Nombre:</span>
                      <span className="font-semibold">{selectedWorkOrder.clientName}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial summary */}
              {/* Expenses Detail */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Detalle de Gastos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Mock expenses data - in real app this would come from the work order */}
                  {(() => {
                    // Generate mock expenses for the selected work order
                    const mockExpenses = [
                      { id: "1", item: "Aceite Repsol 5W-30", amount: selectedWorkOrder.expenses * 0.4 },
                      { id: "2", item: "Filtro de aceite", amount: selectedWorkOrder.expenses * 0.2 },
                      { id: "3", item: "Pastillas de freno", amount: selectedWorkOrder.expenses * 0.3 },
                      { id: "4", item: "Mano de obra", amount: selectedWorkOrder.expenses * 0.1 },
                    ].filter((expense) => expense.amount > 0)

                    return (
                      <div className="space-y-2">
                        {mockExpenses.map((expense, index) => (
                          <div
                            key={expense.id}
                            className="flex justify-between items-center py-2 border-b last:border-b-0"
                          >
                            <span className="text-sm">{expense.item}</span>
                            <span className="font-medium text-red-600">{formatCurrency(expense.amount)}</span>
                          </div>
                        ))}

                        {/* Total expenses */}
                        <div className="flex justify-between items-center py-2 pt-3 border-t font-semibold">
                          <span className="text-sm">Total de Gastos:</span>
                          <span className="text-red-600">{formatCurrency(selectedWorkOrder.expenses)}</span>
                        </div>

                        {/* Total cost and profit */}
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between py-1">
                            <span className="text-sm font-medium">Costo Total Cobrado:</span>
                            <span className="font-semibold text-lg text-green-600">
                              {formatCurrency(selectedWorkOrder.totalCost)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-sm font-medium">Ganancia Neta:</span>
                            <span className="font-semibold text-lg text-blue-600">
                              {formatCurrency(selectedWorkOrder.profit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* Print Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    // TODO: Implement print functionality for work order
                    alert(`Imprimiendo orden de trabajo ${selectedWorkOrder.id}...`)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Orden
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>

          {orderToDelete && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Estás seguro de que deseas eliminar la siguiente orden de trabajo?
              </p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span>{orderToDelete.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Vehículo:</span>
                  <span>{orderToDelete.licensePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cliente:</span>
                  <span>{orderToDelete.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Costo Total:</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(orderToDelete.totalCost)}</span>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Advertencia:</strong> Esta acción no se puede deshacer. Se eliminará permanentemente la orden
                  de trabajo y todos sus datos asociados.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={confirmDeleteWorkOrder} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Orden
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
