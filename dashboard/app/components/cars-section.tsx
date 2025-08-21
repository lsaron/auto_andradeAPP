"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Select from "react-select"
import {
  Edit,
  Eye,
  Plus,
  Trash2,
  CarIcon,
  Wrench,
  Calendar,
  User,
  Hash,
  Palette,
  MapPin,
  History,
  TrendingUp,
  Printer,
  Search,
  X,
  Mail,
  Phone,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Car {
  id: string
  licensePlate: string
  brand: string
  model: string
  year: number
  color?: string
  vin?: string
  owner: string
  ownerId: string
  ownerNationalId?: string
  ownerEmail?: string
  ownerPhone?: string
  ownerAddress?: string
  registrationDate: string
  mileage?: number
}

interface WorkOrder {
  id: string
  carId: string
  licensePlate: string
  clientName: string
  description: string
  totalCost: number
  expenses: number
  profit: number
  date: string
  parts: WorkOrderPart[] // Changed from string[] to WorkOrderPart[]
  invoiceGenerated?: boolean
  invoiceUrl?: string
}

interface WorkOrderPart {
  id: string
  name: string
  cost: number // Costo real
  costCharged: number // Precio cobrado al cliente
  quantity: number
}

interface OwnershipHistory {
  id: string
  carId: string
  ownerId: string
  ownerName: string
  ownerEmail?: string
  ownerPhone?: string
  startDate: string
  endDate?: string
  transferReason?: string
}
type OwnerOption = {
  value: string
  label: string
}

export function CarsSection() {
  // Add these new state variables after the existing ones
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCars, setTotalCars] = useState(0)



  // Update the cars state initialization
  const [cars, setCars] = useState<Car[]>([])

  // Add these state variables after the existing ones
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCars, setFilteredCars] = useState<Car[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isEditCarModalOpen, setIsEditCarModalOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [carToDelete, setCarToDelete] = useState<Car | null>(null)

  const [selectedCarWorkHistory, setSelectedCarWorkHistory] = useState<WorkOrder[]>([])
  const loadCarWorkHistory = async (matricula: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/carros/historial/${matricula}`)
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      
      const trabajos: WorkOrder[] = (data.historial_trabajos || []).map((t: any) => {
        return {
        id: `WO-${t.id}`,
        carId: matricula,
        licensePlate: matricula,
        clientName: data.dueno_actual?.nombre || "Sin cliente",
        description: t.descripcion,
        totalCost: t.costo,
        expenses: (t.gastos || []).reduce((acc: number, g: any) => acc + g.monto, 0),
        profit: t.costo - (t.gastos || []).reduce((acc: number, g: any) => acc + g.monto, 0),
        date: t.fecha,
        parts: (t.gastos || []).map((g: any) => {
          return {
            id: `G-${g.id}`,
            name: g.descripcion,
            cost: g.monto, // Costo real
            costCharged: g.monto_cobrado || g.monto, // Precio cobrado al cliente (si no hay, usar el costo real)
            quantity: 1,
          }
        }),
        invoiceGenerated: false,
              }
      })
      setSelectedCarWorkHistory(trabajos)
    } catch (e) {
      console.error("❌ Error al cargar historial:", e)
      setSelectedCarWorkHistory([])
    }
  }

// call it with the plate when opening modals


  const [owners, setOwners] = useState<{ id: string; name: string }[]>([])

  const [isNewCarModalOpen, setIsNewCarModalOpen] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [isCarDetailModalOpen, setIsCarDetailModalOpen] = useState(false)
  const [isJobsListModalOpen, setIsJobsListModalOpen] = useState(false)
  const [isOwnerHistoryModalOpen, setIsOwnerHistoryModalOpen] = useState(false)
  const [newCar, setNewCar] = useState({
    licensePlate: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    vin: "",
    owner: "",
    ownerId: "",
    mileage: "",
  })

  // Estados para modales de detalles financieros
  const [isExpensesDetailModalOpen, setIsExpensesDetailModalOpen] = useState(false)
  const [isProfitDetailModalOpen, setIsProfitDetailModalOpen] = useState(false)

  const handleAddCar = async () => {
  if (
    newCar.licensePlate &&
    newCar.brand &&
    newCar.model &&
    newCar.year &&
    newCar.ownerId
  ) {
    try {
      const response = await fetch("http://localhost:8000/api/carros/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricula: newCar.licensePlate,
          marca: newCar.brand,
          modelo: newCar.model,
          anio: parseInt(newCar.year),
          id_cliente_actual: newCar.ownerId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al registrar vehículo")
      }

      // Refrescar lista después de agregar
      await loadCars(1, true)

      setNewCar({
        licensePlate: "",
        brand: "",
        model: "",
        year: "",
        color: "",
        vin: "",
        owner: "",
        ownerId: "",
        mileage: "",
      })
      setIsNewCarModalOpen(false)
    } catch (error: any) {
              console.error("Error al registrar vehículo:", error)
        alert(error.message || "Error inesperado")
      }
    } else {
      alert("Por favor, completá todos los campos obligatorios.")
    }
  }

  const loadOwners = async () => {
  try {
    const response = await fetch("http://localhost:8000/api/clientes/")
    const data = await response.json()

    const transformed = data.map((cliente: any) => ({
      id: cliente.id_nacional,
      name: cliente.nombre,
    }))

    setOwners(transformed)
  } catch (error) {
    console.error("Error cargando propietarios:", error)
    setOwners([])
  }
}

  const handleUpdateCar = async () => {
    if (editingCar && editingCar.licensePlate && editingCar.brand && editingCar.model && editingCar.ownerId) {
      try {
        // Verificar si el propietario realmente cambió
        const originalCar = cars.find(car => car.licensePlate === editingCar.licensePlate)
        const ownerChanged = originalCar && originalCar.ownerId !== editingCar.ownerId

        // Si cambió el propietario, registrar en el historial
        if (ownerChanged && originalCar) {
          try {
            const historyResponse = await fetch("http://localhost:8000/api/historial-duenos/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                matricula_carro: editingCar.licensePlate,
                id_cliente_anterior: originalCar.ownerId,
                id_cliente_nuevo: editingCar.ownerId,
                fecha_cambio: new Date().toISOString().split('T')[0],
                motivo_cambio: "Cambio de propietario desde la interfaz"
              })
            })

            if (!historyResponse.ok) {
              console.warn("No se pudo registrar el historial de cambio de propietario")
            }
          } catch (historyError) {
            console.warn("Error al registrar historial:", historyError)
          }
        }

        const response = await fetch(`http://localhost:8000/api/carros/${editingCar.licensePlate}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matricula: editingCar.licensePlate,
            marca: editingCar.brand,
            modelo: editingCar.model,
            anio: editingCar.year,
            id_cliente_actual: editingCar.ownerId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Error al actualizar vehículo")
        }

        // Refrescar lista después de actualizar
        await loadCars(1, true)

        setEditingCar(null)
        setIsEditCarModalOpen(false)
      } catch (error: any) {
        console.error("Error al actualizar vehículo:", error)
        alert(error.message || "Error inesperado")
      }
    }
  }

  const handleViewCar = async (car: Car) => {
    setSelectedCar(car)
    setIsCarDetailModalOpen(true)
    setSelectedCarWorkHistory([]) // avoid stale data flash
    await loadCarWorkHistory(car.licensePlate)
  }
  

  const handleEditCar = async (car: Car) => {
    setEditingCar(car)
    setIsEditCarModalOpen(true)
  }

  const handleDeleteCar = async (car: Car) => {
    setCarToDelete(car)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteCar = async () => {
    if (!carToDelete) return

    try {
      const response = await fetch(`http://localhost:8000/api/carros/${carToDelete.licensePlate}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al eliminar vehículo")
      }

      // Refrescar lista después de eliminar
      await loadCars(1, true)
    } catch (error: any) {
      console.error("Error al eliminar vehículo:", error)
      alert(error.message || "Error inesperado")
    } finally {
      setDeleteConfirmOpen(false)
      setCarToDelete(null)
    }
  }

  const handleViewJobsList = async (car: Car) => {
    setSelectedCar(car)
    setIsJobsListModalOpen(true)
    setSelectedCarWorkHistory([])
    await loadCarWorkHistory(car.licensePlate)
  }

  const handleViewOwnerHistory = async (car: Car) => {
    setSelectedCar(car)
    setIsOwnerHistoryModalOpen(true)
    // Cargar el historial de propietarios
    await loadCarOwnershipHistory(car.licensePlate)
  }

  const [carOwnershipHistory, setCarOwnershipHistory] = useState<OwnershipHistory[]>([])

  const loadCarOwnershipHistory = async (matricula: string) => {
    console.log("🔍 loadCarOwnershipHistory called with matricula:", matricula)
    try {
      const history = await getCarOwnershipHistory(matricula)
      console.log("🔍 Historial obtenido:", history)
      setCarOwnershipHistory(history)
    } catch (error) {
      console.error("Error al cargar historial de propietarios:", error)
      setCarOwnershipHistory([])
    }
  }

  

  const getCarOwnershipHistory = async (matricula: string): Promise<OwnershipHistory[]> => {
    console.log("🔍 getCarOwnershipHistory called with matricula:", matricula)
    try {
      const url = `http://localhost:8000/api/carro/${matricula}/historial`
      console.log("🔍 Fetching from URL:", url)
      
      const response = await fetch(url)
      console.log("🔍 Response status:", response.status)
      
      if (response.status === 404) {
        console.log("🔍 No hay historial para este vehículo (404) - esto es normal para vehículos nuevos")
        return []
      }
      
      if (!response.ok) {
        console.warn("No se pudo obtener el historial de propietarios, status:", response.status)
        return []
      }
      
      const data = await response.json()
      console.log("🔍 Raw data from API:", data)
      console.log("🔍 Data type:", typeof data)
      console.log("🔍 Data length:", Array.isArray(data) ? data.length : "Not an array")
      
      if (!Array.isArray(data)) {
        console.warn("⚠️ API no retornó un array:", data)
        return []
      }
      
      // Ahora el backend retorna TODOS los registros, incluyendo el actual
      // El propietario actual es el que tiene fecha_fin = null
      // Los propietarios anteriores son los que tienen fecha_fin establecida
      console.log("🔍 Processing all records from API:", data.length)
      
      // Filtrar solo los registros que tienen fecha_fin (propietarios anteriores)
      const previousOwners = data.filter((item: any) => {
        console.log("🔍 Checking item:", item)
        console.log("🔍 Item fecha_fin:", item.fecha_fin)
        console.log("🔍 Item fecha_fin type:", typeof item.fecha_fin)
        console.log("🔍 Item fecha_fin !== null:", item.fecha_fin !== null)
        return item.fecha_fin !== null
      })
      
      console.log("🔍 Previous owners found:", previousOwners.length)
      
      const mappedData = previousOwners.map((item: any) => ({
        id: item.id.toString(),
        carId: item.matricula_carro,
        ownerId: item.id_cliente_anterior,
        ownerName: item.nombre_cliente_anterior || "Cliente no encontrado",
        ownerEmail: item.email_cliente_anterior,
        ownerPhone: item.telefono_cliente_anterior,
        startDate: item.fecha_cambio,
        endDate: item.fecha_fin,
        transferReason: item.motivo_cambio
      }))
      
      console.log("🔍 Mapped data (previous owners only):", mappedData)
      return mappedData
    } catch (error) {
      console.error("Error al obtener historial de propietarios:", error)
      return []
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handlePrintInvoice = async (workOrder: WorkOrder) => {
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.workOrders.generateInvoice(workOrder.id)
      // window.open(response.data.invoiceUrl, '_blank')

      console.log("Generating invoice for:", workOrder.id)

      // Mock implementation - replace with actual API call
      if (workOrder.invoiceGenerated && workOrder.invoiceUrl) {
        // If invoice already exists, open it
        window.open(workOrder.invoiceUrl, "_blank")
      } else {
        // Generate new invoice
        alert(`Generando factura para el trabajo ${workOrder.id}...`)
        // After successful generation, you would update the work order status
        // and refresh the data
      }
    } catch (error) {
      console.error("Error generating invoice:", error)
      alert("Error al generar la factura. Inténtalo de nuevo.")
    }
  }

  // Add this function after handlePrintInvoice
  const handleSearch = async (query: string) => {
    console.log("🔍 handleSearch called with query:", query)
    setSearchQuery(query)

    if (!query.trim()) {
      console.log("🔍 Empty query, reloading all cars...")
      // Reload cars to ensure we have the complete list
      await loadCars(1, true)
      // No habilitar infinite scroll ya que no hay paginación real
      return
    }

    setIsSearching(true)

    try {
      // TODO: Implement API search endpoint
      // For now, filter the current loaded cars
      const filtered = cars.filter(
        (car: Car) =>
          car.id.toLowerCase().includes(query.toLowerCase()) ||
          car.licensePlate.toLowerCase().includes(query.toLowerCase()) ||
          car.owner.toLowerCase().includes(query.toLowerCase()) ||
          car.brand.toLowerCase().includes(query.toLowerCase()) ||
          car.model.toLowerCase().includes(query.toLowerCase()),
      )

      await new Promise((resolve) => setTimeout(resolve, 300))
      setFilteredCars(filtered)
      setHasMore(false) // Disable infinite scroll during search
    } catch (error) {
      console.error("Error searching cars:", error)
      setFilteredCars([])
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
  }





  // Add useEffect to initialize filtered cars and handle search
  useEffect(() => {
    loadCars(1, true) // Load first page on mount
    loadOwners()
  }, [])

  // Auto-refresh when switching selected car
  useEffect(() => {
    if (selectedCar) {
      loadCarWorkHistory(selectedCar.licensePlate)
    }
  }, [selectedCar])

  // Remove this entire useEffect - it's causing the infinite loop
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     handleSearch(searchQuery)
  //   }, 300) // Debounce search

  //   return () => clearTimeout(timeoutId)
  // }, [searchQuery, cars]) // <- This dependency on 'cars' causes the loop

  // Add this useEffect instead - only depends on searchQuery
  useEffect(() => {
    console.log("🔍 useEffect triggered, searchQuery:", searchQuery)
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        console.log("🔍 Calling handleSearch with query:", searchQuery)
        handleSearch(searchQuery)
      } else if (searchQuery === "") {
        console.log("🔍 Search cleared, calling handleSearch with empty string")
        // When search is completely cleared, reload all cars
        handleSearch("")
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery]) // Only depend on searchQuery, not cars

  // Add this new function to handle API calls with pagination
  const loadCars = async (pageNum: number, reset = false) => {
    if (loading) return

    try {
      setLoading(true)
      setError(null)

      if (reset) {
        setInitialLoading(true)
      }

      // Llamada real al backend local
      const response = await fetch("http://localhost:8000/api/carros/")
      const data = await response.json()

      console.log("🔍 Datos recibidos del backend:", JSON.stringify(data, null, 2))

      // Obtener información completa de los clientes
      const clientIds = [...new Set(data.map((car: any) => car.id_cliente_actual))]
      console.log("🔍 IDs de clientes únicos:", clientIds)
      
      const clientDetails: Record<string, any> = {}
      for (const clientId of clientIds) {
        try {
          const clientResponse = await fetch(`http://localhost:8000/api/clientes/${clientId as string}`)
          if (clientResponse.ok) {
            const clientData = await clientResponse.json()
            clientDetails[clientId as string] = clientData
            console.log("🔍 Datos del cliente:", clientId, clientData)
          }
        } catch (error) {
          console.warn("🔍 Error obteniendo datos del cliente:", clientId, error)
        }
      }

      // Adaptar la estructura del backend a la esperada por el frontend
      const transformed = data.map((car: any, index: number) => {
        const clientInfo = clientDetails[car.id_cliente_actual as string] || {}
        console.log("🔍 Carro individual:", car)
        console.log("🔍 Información del cliente:", clientInfo)
        
        return {
          id: `${car.matricula}-${car.id_cliente_actual}`, // ID único basado en placa y cliente
          licensePlate: car.matricula,
          brand: car.marca,
          model: car.modelo,
          year: car.anio,
          owner: car.nombre_cliente,
          ownerId: car.id_cliente_actual,
          ownerNationalId: clientInfo.id_nacional || clientInfo.cedula || car.id_cliente_actual,
          ownerEmail: clientInfo.correo || clientInfo.email,
          ownerPhone: clientInfo.telefono || clientInfo.phone,
          registrationDate: new Date().toISOString().split("T")[0], // Default temporal
        }
      })

      console.log("🔍 Datos transformados:", transformed)

      // Siempre reemplazar los datos, no concatenar
      setCars(transformed)
      setFilteredCars(transformed)
      setTotalCars(transformed.length)
      
      // Como no hay paginación real en el backend, siempre marcamos que no hay más
      setHasMore(false)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error cargando vehículos"))
      if (reset) {
        setCars([])
        setFilteredCars([])
      }
    } finally {
      setLoading(false)
      if (reset) {
        setInitialLoading(false)
      }
    }
  }



  // Add infinite scroll handler
  const handleLoadMore = () => {
    if (!loading && hasMore && !searchQuery) {
      loadCars(page + 1, false)
    }
  }
  useEffect(() => {
  console.log("🧠 Clientes cargados en owners:", owners)}, [owners])
  const ownerOptions: OwnerOption[] = owners.map((owner) => {
    return {
      value: owner.id,
      label: owner.name,
    }
  })
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Gestión de Vehículos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Administra todos los vehículos registrados</p>
        </div>
        <Dialog open={isNewCarModalOpen} onOpenChange={setIsNewCarModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nuevo Vehículo</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-50">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Registrar Nuevo Vehículo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="licensePlate" className="sm:text-right text-sm">
                  Placa
                </Label>
                <Input
                  id="licensePlate"
                  value={newCar.licensePlate}
                  onChange={(e) => setNewCar({ ...newCar, licensePlate: e.target.value.toUpperCase() })}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="brand" className="sm:text-right text-sm">
                  Marca
                </Label>
                <Input
                  id="brand"
                  value={newCar.brand}
                  onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="model" className="sm:text-right text-sm">
                  Modelo
                </Label>
                <Input
                  id="model"
                  value={newCar.model}
                  onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="year" className="sm:text-right text-sm">
                  Año
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={newCar.year}
                  onChange={(e) => setNewCar({ ...newCar, year: e.target.value })}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="ownerId" className="sm:text-right text-sm">
                  Propietario
                </Label>
                <Select<OwnerOption>
                  id="ownerId"
                  options={ownerOptions}
                  value={ownerOptions.find((option) => option.value === newCar.ownerId) || null}
                  onChange={(selected) => {
                    setNewCar({
                      ...newCar,
                      ownerId: selected?.value || "",
                      owner: selected?.label || "",
                    })
                  }}
                  placeholder="Buscar propietario..."
                  isClearable
                  className="sm:col-span-3"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      fontSize: "14px",
                    }),
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewCarModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleAddCar} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                Registrar Vehículo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>

        {/* Edit Car Modal */}
        <Dialog open={isEditCarModalOpen} onOpenChange={setIsEditCarModalOpen}>
              <DialogContent className="sm:max-w-[425px] mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-50">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Editar Vehículo</DialogTitle>
                </DialogHeader>

                {editingCar && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                      <Label htmlFor="edit-licensePlate" className="sm:text-right text-sm">
                        Placa
                      </Label>
                      <Input
                        id="edit-licensePlate"
                        value={editingCar.licensePlate}
                        onChange={(e) => setEditingCar({ ...editingCar, licensePlate: e.target.value })}
                        className="sm:col-span-3"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                      <Label htmlFor="edit-brand" className="sm:text-right text-sm">
                        Marca
                      </Label>
                      <Input
                        id="edit-brand"
                        value={editingCar.brand}
                        onChange={(e) => setEditingCar({ ...editingCar, brand: e.target.value })}
                        className="sm:col-span-3"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                      <Label htmlFor="edit-model" className="sm:text-right text-sm">
                        Modelo
                      </Label>
                      <Input
                        id="edit-model"
                        value={editingCar.model}
                        onChange={(e) => setEditingCar({ ...editingCar, model: e.target.value })}
                        className="sm:col-span-3"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                      <Label htmlFor="edit-year" className="sm:text-right text-sm">
                        Año
                      </Label>
                      <Input
                        id="edit-year"
                        type="number"
                        value={editingCar.year}
                        onChange={(e) =>
                          setEditingCar({
                            ...editingCar,
                            year: Number.parseInt(e.target.value) || editingCar.year,
                          })
                        }
                        className="sm:col-span-3"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                      <Label htmlFor="edit-ownerId" className="sm:text-right text-sm">
                        Propietario
                      </Label>
                      <div className="sm:col-span-3">
                        <Select
                          value={ownerOptions.find(option => option.value === editingCar.ownerId)}
                          onChange={(selectedOption) => {
                            if (selectedOption) {
                              setEditingCar({
                                ...editingCar,
                                ownerId: selectedOption.value,
                                owner: selectedOption.label,
                              })
                            }
                          }}
                          options={ownerOptions}
                          placeholder="Seleccionar propietario..."
                          isSearchable={true}
                          isClearable={true}
                          className="text-sm"
                          styles={{
                            control: (provided) => ({
                              ...provided,
                              minHeight: '40px',
                              fontSize: '14px',
                            }),
                            option: (provided) => ({
                              ...provided,
                              fontSize: '14px',
                            }),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditCarModalOpen(false)} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateCar} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    Actualizar Vehículo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
              
      {/* Search Section */}
      <Card className="w-full">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa, propietario, marca o modelo..."
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
            {searchQuery && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isSearching ? (
                  <>
                    {/*<LoadingSpinner size="sm" />*/}
                    <span>Buscando...</span>
                  </>
                ) : (
                  <span>
                    {filteredCars.length} resultado{filteredCars.length !== 1 ? "s" : ""} encontrado
                    {filteredCars.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Search Results Summary */}
          {searchQuery && !isSearching && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Búsqueda: "{searchQuery}"
              </Badge>
              {filteredCars.length === 0 && (
                <Badge variant="destructive" className="text-xs">
                  Sin resultados
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center justify-between">
            <span>Lista de Vehículos</span>
            <div className="text-sm font-normal text-muted-foreground">
              {searchQuery
                ? `${filteredCars.length} resultado${filteredCars.length !== 1 ? "s" : ""}`
                : `${cars.length} de ${totalCars} vehículos`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* Loading state for initial load */}
          {initialLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-muted-foreground">Cargando vehículos...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.876c1.398 0 2.63-1.1 2.63-2.456 0-.357-.078-.709-.227-1.044L18.31 7.5c-.149-.335-.35-.65-.604-.905a2.637 2.637 0 00-1.899-.845H8.193c-.729 0-1.412.32-1.899.845-.254.255-.455.57-.604.905L2.657 15.5c-.149.335-.227.687-.227 1.044C2.43 17.9 3.662 19 5.06 19z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Error al cargar vehículos</h3>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => loadCars(1, true)} variant="outline" className="bg-transparent">
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Placa</TableHead>
                        <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Marca</TableHead>
                        <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Modelo</TableHead>
                        <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">Año</TableHead>
                        <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Propietario</TableHead>
                        <TableHead className="px-2 sm:px-4 text-xs sm:text-sm text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCars.map((car, index) => (
                        <TableRow key={`${car.id}-${index}`} className="hover:bg-gray-50">
                          <TableCell className="font-medium px-2 sm:px-4 text-xs sm:text-sm">
                            {car.licensePlate}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 text-xs sm:text-sm">{car.brand}</TableCell>
                          <TableCell className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
                            {car.model}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">
                            {car.year}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 text-xs sm:text-sm max-w-[120px] truncate">
                            {car.owner}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 text-right">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-blue-50 hover:text-blue-600 bg-transparent p-1 sm:p-2 h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => handleViewCar(car)}
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-green-50 hover:text-green-600 bg-transparent p-1 sm:p-2 h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => handleEditCar(car)}
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-red-50 hover:text-red-600 bg-transparent p-1 sm:p-2 h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => handleDeleteCar(car)}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Load More Button - Only show when not searching */}
              {!searchQuery && hasMore && (
                <div className="flex justify-center pt-6 border-t">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outline"
                    className="w-full sm:w-auto bg-transparent"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Cargando más...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Cargar más vehículos ({totalCars - cars.length} restantes)
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* End of list message */}
              {!searchQuery && !hasMore && cars.length > 0 && (
                <div className="text-center py-6 border-t">
                  <div className="text-sm text-muted-foreground">✅ Se han cargado todos los {totalCars} vehículos</div>
                </div>
              )}

              {/* Search results empty state */}
              {searchQuery && !isSearching && filteredCars.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron vehículos</h3>
                  <p className="text-muted-foreground mb-4">
                    No se encontraron vehículos que coincidan con "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={clearSearch} className="bg-transparent">
                    Limpiar búsqueda
                  </Button>
                </div>
              )}

              {/* Empty state for no cars at all */}
              {!searchQuery && cars.length === 0 && !loading && (
                <div className="text-center py-12">
                  <CarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No hay vehículos registrados</h3>
                  <p className="text-muted-foreground mb-4">Comienza registrando el primer vehículo en el sistema</p>
                  <Button onClick={() => setIsNewCarModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primer Vehículo
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Car Detail Modal */}
      <Dialog open={isCarDetailModalOpen} onOpenChange={setIsCarDetailModalOpen}>
        <DialogContent className="max-w-4xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <CarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              Información Completa del Vehículo
            </DialogTitle>
          </DialogHeader>

          {selectedCar && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="info" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">Información del Vehículo</span>
                  <span className="sm:hidden">Información</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">
                    Historial de Trabajos ({selectedCarWorkHistory.length})
                  </span>
                  <span className="sm:hidden">Trabajos ({selectedCarWorkHistory.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6 mt-4 sm:mt-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Vehicle Information */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CarIcon className="h-5 w-5" />
                        Datos del Vehículo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Placa:
                        </span>
                        <span className="font-semibold text-lg">{selectedCar.licensePlate}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium">Marca:</span>
                        <span>{selectedCar.brand}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium">Modelo:</span>
                        <span>{selectedCar.model}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium">Año:</span>
                        <span>{selectedCar.year}</span>
                      </div>
                      {selectedCar.color && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Color:
                          </span>
                          <span>{selectedCar.color}</span>
                        </div>
                      )}
                      {selectedCar.vin && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm font-medium">VIN:</span>
                          <span className="font-mono text-xs sm:text-sm break-all">{selectedCar.vin}</span>
                        </div>
                      )}
                      {selectedCar.mileage && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm font-medium">Kilometraje:</span>
                          <span>{selectedCar.mileage.toLocaleString()} km</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Fecha de registro:
                        </span>
                        <span>{formatDate(selectedCar.registrationDate)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Owner Information */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" />
                        Información del Propietario
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium">Nombre:</span>
                        <span className="font-semibold">{selectedCar.owner}</span>
                      </div>
                      {selectedCar.ownerNationalId && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Cédula:
                          </span>
                          <span className="font-mono text-sm">{selectedCar.ownerNationalId}</span>
                        </div>
                      )}
                      {selectedCar.ownerEmail && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email:
                          </span>
                          <span className="text-sm break-all">{selectedCar.ownerEmail}</span>
                        </div>
                      )}
                      {selectedCar.ownerPhone && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Teléfono:
                          </span>
                          <span className="font-mono">{selectedCar.ownerPhone}</span>
                        </div>
                      )}
                      {selectedCar.ownerAddress && (
                        <div className="flex justify-between py-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Dirección:
                          </span>
                          <span className="text-sm text-right max-w-[200px] break-words">
                            {selectedCar.ownerPhone}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Statistics - Updated Layout */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleViewJobsList(selectedCar)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedCarWorkHistory.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Trabajos Completados</div>
                        <div className="text-xs text-blue-600 mt-1">Click para ver lista</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleViewOwnerHistory(selectedCar)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {carOwnershipHistory.length + 1}
                        </div>
                        <div className="text-sm text-muted-foreground">Historial de Propietarios</div>
                        <div className="text-xs text-purple-600 mt-1">Click para ver historial</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => setIsExpensesDetailModalOpen(true)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(
                            selectedCarWorkHistory.reduce((sum, order) => sum + order.expenses, 0),
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">Gastos Totales del Carro</div>
                        <div className="text-xs text-red-600 mt-1">Click para ver detalles</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Financial Dashboards - Second Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(
                            selectedCarWorkHistory.reduce((sum, order) => sum + order.totalCost, 0),
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">Ingresos Totales del Carro</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => setIsProfitDetailModalOpen(true)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(
                            selectedCarWorkHistory.reduce((sum, order) => {
                              // Calcular ganancia total incluyendo markup de repuestos
                              const gastosReales = order.expenses;
                                                      const gastosCobrados = order.parts?.reduce((total, part) => {
                          // Usar el precio real cobrado al cliente del backend
                          return total + (part.costCharged * part.quantity);
                        }, 0) || gastosReales;
                              
                              const gananciaRepuestos = gastosCobrados - gastosReales;
                              const gananciaBase = order.totalCost - gastosReales;
                              const gananciaTotal = gananciaBase + gananciaRepuestos;
                              
                              return sum + gananciaTotal;
                            }, 0),
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">Ganancias Generadas</div>
                        <div className="text-xs text-green-600 mt-1">Click para ver desglose</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4 sm:mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Historial de Trabajos Realizados</h3>
                </div>

                {selectedCarWorkHistory.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedCarWorkHistory.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                            <div className="space-y-1">
                              <h4 className="font-semibold text-lg">{order.id}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {formatDate(order.date)}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-xl font-bold text-blue-600">{formatCurrency(order.totalCost)}</div>
                              <div className="text-xs text-muted-foreground">
                                Ganancia Base: {formatCurrency(order.totalCost - order.expenses)}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintInvoice(order)}
                                className="text-xs"
                              >
                                <Printer className="h-3 w-3 mr-1" />
                                {order.invoiceGenerated ? "Ver Factura" : "Generar Factura"}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium">Descripción:</span>
                              <p className="text-sm text-gray-700 mt-1">{order.description}</p>
                            </div>

                            <div>
                              <span className="text-sm font-medium">Gastos Reales:</span>
                              <p className="text-sm font-semibold text-red-600">{formatCurrency(order.expenses)}</p>
                            </div>

                            {order.parts && order.parts.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Repuestos y Costos:</span>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <div className="w-3 h-3 bg-red-600 rounded"></div>
                                      Costo Real
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <div className="w-3 h-3 bg-green-600 rounded"></div>
                                      Precio Cliente
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 space-y-2">
                                  {order.parts.map((part) => {
                                    const costoReal = part.cost * part.quantity;
                                    const precioCobrado = part.costCharged * part.quantity; // Usar el precio real del backend
                                    return (
                                      <div
                                        key={part.id}
                                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                      >
                                        <div className="flex-1">
                                          <span className="text-sm font-medium">{part.name}</span>
                                          <span className="text-xs text-muted-foreground ml-2">x{part.quantity}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm text-red-600">
                                            {formatCurrency(costoReal)}
                                          </span>
                                          <span className="text-sm font-semibold text-green-600">
                                            {formatCurrency(precioCobrado)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground pt-2 border-t">
                              <div>Gastos Reales: {formatCurrency(order.expenses)}</div>
                              <div>Ganancia Base: {formatCurrency(order.totalCost - order.expenses)}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No hay trabajos registrados</h3>
                    <p className="text-muted-foreground">
                      Este vehículo aún no tiene trabajos realizados en el taller.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCarDetailModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Jobs List Modal */}
      <Dialog open={isJobsListModalOpen} onOpenChange={setIsJobsListModalOpen}>
        <DialogContent className="max-w-4xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Wrench className="h-5 w-5" />
              Trabajos Completados - {selectedCar?.licensePlate}
            </DialogTitle>
          </DialogHeader>

          {selectedCar && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total de trabajos: {selectedCarWorkHistory.length}
              </div>



              {selectedCarWorkHistory.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedCarWorkHistory.map((order) => (
                    <Card key={order.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-lg">{order.id}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(order.date)}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-xl font-bold text-green-600">{formatCurrency(order.totalCost)}</div>
                            <div className="text-xs text-gray-600">
                              Ganancia Base: {formatCurrency(order.totalCost - order.expenses)}
                            </div>
                            <div className="text-xs text-blue-600">
                              Ganancia: {formatCurrency((order.totalCost - order.expenses) + (order.parts?.reduce((total, part) => {
                                const costoReal = part.cost * part.quantity;
                                const precioCobrado = part.costCharged * part.quantity;
                                return total + (precioCobrado - costoReal);
                              }, 0) || 0))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium">Descripción:</span>
                            <p className="text-sm text-gray-700 mt-1">{order.description}</p>
                          </div>

                          <div>
                            <span className="text-sm font-medium">Gastos:</span>
                            <div className="flex gap-4 mt-1">
                              <div>
                                <span className="text-xs text-muted-foreground">Real:</span>
                                <p className="text-sm font-semibold text-red-600">{formatCurrency(order.expenses)}</p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Cobrado:</span>
                                <p className="text-sm font-semibold text-green-600">
                                  {formatCurrency(order.parts?.reduce((total, part) => {
                                    return total + (part.costCharged * part.quantity);
                                  }, 0) || order.expenses)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Ganancia por Repuestos */}
                          {(() => {
                            const gananciaRepuestos = order.parts?.reduce((total, part) => {
                              const costoReal = part.cost * part.quantity;
                              const precioCobrado = part.costCharged * part.quantity;
                              const ganancia = precioCobrado - costoReal;
                              return total + (ganancia > 0 ? ganancia : 0);
                            }, 0) || 0;
                            
                            if (gananciaRepuestos > 0) {
                              return (
                                <div className="flex justify-between items-center py-1 text-green-600">
                                  <span className="text-sm font-medium">Ganancia por Repuestos:</span>
                                  <span className="font-semibold">+{formatCurrency(gananciaRepuestos)}</span>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {order.parts && order.parts.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Repuestos y Costos:</span>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-red-600 rounded"></div>
                                    Costo Real
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                                    Precio Cliente
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 space-y-2">
                                {order.parts.map((part) => {
                                  const costoReal = part.cost * part.quantity;
                                  const precioCobrado = part.costCharged * part.quantity;
                                  const profit = precioCobrado - costoReal;
                                  return (
                                    <div
                                      key={part.id}
                                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                    >
                                      <div className="flex-1">
                                        <span className="text-sm font-medium">{part.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">x{part.quantity}</span>
                                      </div>
                                                                              <div className="flex items-center gap-3">
                                          <span className="text-sm text-red-600">
                                            {formatCurrency(costoReal)}
                                          </span>
                                          <span className="text-sm font-semibold text-green-600">
                                            {formatCurrency(precioCobrado)}
                                          </span>
                                        </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground pt-2 border-t">
                            <div>Total Gastos: {formatCurrency(order.expenses)}</div>
                            <div>Ganancia Neta: {formatCurrency((() => {
                              const gananciaBase = order.totalCost - order.expenses;
                              const gananciaRepuestos = order.parts?.reduce((total, part) => {
                                const costoReal = part.cost * part.quantity;
                                const precioCobrado = part.costCharged * part.quantity;
                                const ganancia = precioCobrado - costoReal;
                                return total + (ganancia > 0 ? ganancia : 0);
                              }, 0) || 0;
                              return gananciaBase + gananciaRepuestos;
                            })())}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No hay trabajos registrados</h3>
                  <p className="text-muted-foreground">Este vehículo aún no tiene trabajos realizados en el taller.</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsJobsListModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Owner History Modal */}
      <Dialog open={isOwnerHistoryModalOpen} onOpenChange={setIsOwnerHistoryModalOpen}>
        <DialogContent className="max-w-3xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <History className="h-5 w-5" />
              Historial de Propietarios - {selectedCar?.licensePlate}
            </DialogTitle>
          </DialogHeader>

          {selectedCar && (
            <div className="space-y-4">

              
              <div className="text-sm text-muted-foreground">
                Total de propietarios: {carOwnershipHistory.length + 1}
              </div>

              {/* Info message */}
              <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <strong>💡 Información:</strong> El historial muestra solo los propietarios anteriores. 
                El propietario actual se muestra en la tarjeta verde arriba. 
                <br/><br/>
                <strong>🔍 Estado actual:</strong> Este vehículo tiene {carOwnershipHistory.length} propietario(s) anterior(es) registrado(s).
                {carOwnershipHistory.length === 0 && " Para crear historial, edita el vehículo y cambia el propietario."}
              </div>

              <div className="space-y-4">
                {/* Current Owner */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-lg">{selectedCar.owner}</h4>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Propietario Actual
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Desde: {formatDate(selectedCar.registrationDate)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {selectedCar.ownerEmail && (
                        <div>
                          <span className="font-medium">Email:</span> {selectedCar.ownerEmail}
                        </div>
                      )}
                      {selectedCar.ownerPhone && (
                        <div>
                          <span className="font-medium">Teléfono:</span> {selectedCar.ownerPhone}
                        </div>
                      )}
                      {selectedCar.ownerAddress && (
                        <div>
                          <span className="font-medium">Dirección:</span> {selectedCar.ownerAddress}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Previous Owners */}
                {carOwnershipHistory.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Propietarios Anteriores ({carOwnershipHistory.length})
                    </h4>
                    {carOwnershipHistory.map((history: OwnershipHistory) => (
                      <Card key={history.id} className="border-l-4 border-l-gray-400">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="space-y-1">
                              <h4 className="font-semibold text-lg">{history.ownerName}</h4>
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                Propietario Anterior
                              </Badge>
                            </div>
                            <div className="text-right text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                Desde: {formatDate(history.startDate)}
                              </div>
                              {history.endDate && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  Hasta: {formatDate(history.endDate)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            {history.ownerEmail && (
                              <div>
                                <span className="font-medium">Email:</span> {history.ownerEmail}
                              </div>
                            )}
                            {history.ownerPhone && (
                              <div>
                                <span className="font-medium">Teléfono:</span> {history.ownerPhone}
                              </div>
                            )}
                            {history.transferReason && (
                              <div>
                                <span className="font-medium">Motivo del cambio:</span> {history.transferReason}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Sin historial de cambios</h3>
                    <p className="text-muted-foreground">
                      Este vehículo no ha tenido cambios de propietario registrados.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      El historial se creará automáticamente cuando cambies el propietario.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Para crear historial:</strong><br/>
                        1. Edita este vehículo<br/>
                        2. Cambia el propietario a otro cliente<br/>
                        3. El historial se creará automáticamente
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOwnerHistoryModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {carToDelete && (
                <>
                  ¿Estás seguro de que deseas eliminar el vehículo{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{carToDelete.licensePlate}</span> (
                  {carToDelete.brand} {carToDelete.model} {carToDelete.year})?
                  <br />
                  <br />
                  <span className="text-red-600 font-medium">
                    Esta acción no se puede deshacer y eliminará permanentemente:
                  </span>
                  <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                    <li>Toda la información del vehículo</li>
                    <li>El historial de trabajos realizados</li>
                    <li>El historial de propietarios</li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmOpen(false)
                setCarToDelete(null)
              }}
              className="bg-transparent"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCar} className="bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Vehículo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Detalles de Gastos */}
      <Dialog open={isExpensesDetailModalOpen} onOpenChange={setIsExpensesDetailModalOpen}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-red-100 rounded-full">
                <div className="w-6 h-6 text-red-600">
                  <Hash className="w-6 h-6" />
                </div>
              </div>
              Detalles de Gastos - {selectedCar?.licensePlate}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resumen General */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      selectedCarWorkHistory.reduce((sum, order) => sum + order.expenses, 0)
                    )}
                  </div>
                  <div className="text-sm text-red-700">Gastos Reales</div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      selectedCarWorkHistory.reduce((sum, order) => {
                        const gastosCobrados = order.parts?.reduce((total, part) => {
                          // Usar el precio real cobrado al cliente del backend
                          return total + (part.costCharged * part.quantity);
                        }, 0) || order.expenses;
                        return sum + gastosCobrados;
                      }, 0)
                    )}
                  </div>
                  <div className="text-sm text-blue-700">Gastos Cobrados</div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      selectedCarWorkHistory.reduce((sum, order) => {
                        const gastosReales = order.expenses;
                        const gastosCobrados = order.parts?.reduce((total, part) => {
                          // Usar el precio real cobrado al cliente del backend
                          return total + (part.costCharged * part.quantity);
                        }, 0) || gastosReales;
                        const gananciaRepuestos = gastosCobrados - gastosReales;
                        return sum + gananciaRepuestos;
                      }, 0)
                    )}
                  </div>
                  <div className="text-sm text-green-700">Ganancia Repuestos</div>
                </CardContent>
              </Card>
            </div>


          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsExpensesDetailModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalles de Ganancias */}
      <Dialog open={isProfitDetailModalOpen} onOpenChange={setIsProfitDetailModalOpen}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-green-100 rounded-full">
                <div className="w-6 h-6 text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              Detalles de Ganancias - {selectedCar?.licensePlate}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resumen General */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      selectedCarWorkHistory.reduce((sum, order) => {
                        const gastosReales = order.expenses;
                        const gananciaBase = order.totalCost - gastosReales;
                        return sum + gananciaBase;
                      }, 0)
                    )}
                  </div>
                  <div className="text-sm text-blue-700">Ganancia Base</div>
                  <div className="text-xs text-blue-600 mt-1">Mano de Obra - Gastos Reales</div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      selectedCarWorkHistory.reduce((sum, order) => {
                        const gastosReales = order.expenses;
                        const gastosCobrados = order.parts?.reduce((total, part) => {
                          // Usar el precio real cobrado al cliente del backend
                          return total + (part.costCharged * part.quantity);
                        }, 0) || gastosReales;
                        const gananciaRepuestos = gastosCobrados - gastosReales;
                        const gananciaBase = order.totalCost - gastosReales;
                        const gananciaTotal = gananciaBase + gananciaRepuestos;
                        return sum + gananciaTotal;
                      }, 0)
                    )}
                  </div>
                  <div className="text-sm text-green-700">Ganancia Total</div>
                  <div className="text-xs text-green-600 mt-1">Ganacia Base + Ganancia Repuestos</div>
                </CardContent>
              </Card>
            </div>


          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsProfitDetailModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
