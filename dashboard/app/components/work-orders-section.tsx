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
import { Edit, Eye, Plus, Trash2, Search, X, Calendar, Car, FileText, Printer, Coins, Users, Wrench } from "lucide-react"
import Select from "react-select"
import { mecanicosApi } from "@/lib/api-client"
import type { Mechanic, AsignacionMecanico } from "@/lib/types"

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
  expenseDetails?: Expense[] // Agregar gastos detallados
  assignedMechanics?: Array<{
    id_mecanico: number
    nombre_mecanico: string
    porcentaje_comision: number
    monto_comision: number
    fecha_asignacion?: string
  }> // Agregar mecánicos asignados
  manoObra: number // Campo para mano de obra (requerido)
  markupRepuestos: number // Campo para markup de repuestos (requerido)
}

interface Expense {
  id: string
  item: string
  amount: string
  amountCharged?: string // Campo opcional para el precio cobrado al cliente
}

type VehicleOption = {
  value: string
  label: string
}

// Opciones para los filtros de fecha
const monthOptions = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

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
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
  })

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
    manoObra: "", // Nuevo campo para mano de obra
    expenses: [] as { id: string; item: string; amount: string; amountCharged: string }[],
    applyWork: false, // Campo para controlar si se aplica IVA
  })

  // Add after the existing modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<WorkOrder | null>(null)
  
  // Print options modal state
  const [isPrintOptionsModalOpen, setIsPrintOptionsModalOpen] = useState(false)
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<WorkOrder | null>(null)

  // Form state
  const [newOrder, setNewOrder] = useState({
    licensePlate: "",
    description: "",
    totalCost: "",
    manoObra: "", // Nuevo campo para mano de obra
    clientName: "",
    expenses: [] as { id: string; item: string; amount: string; amountCharged: string }[],
    applyWork: false, // Add this new field
  })

  // Estado para mecánicos
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [selectedMechanics, setSelectedMechanics] = useState<AsignacionMecanico[]>([])
  const [isLoadingMechanics, setIsLoadingMechanics] = useState(false)
  const [mechanicsError, setMechanicsError] = useState<string | null>(null)

  // Estado para opciones de años dinámicas
  const [yearOptions, setYearOptions] = useState<Array<{ value: string; label: string }>>([])

  // Debug: Monitorear cambios en editOrder
  useEffect(() => {
    console.log("🔍 editOrder actualizado:", editOrder)
    if (editOrder.expenses.length > 0) {
      console.log("🔍 Gastos en editOrder:", editOrder.expenses)
      editOrder.expenses.forEach((expense, index) => {
        console.log(`🔍 Gasto ${index}:`, {
          id: expense.id,
          item: expense.item,
          amount: expense.amount,
          amountCharged: expense.amountCharged
        })
      })
    }
  }, [editOrder])

  // Función para generar opciones de años basándose en los datos reales
  const generateYearOptions = useCallback((orders: WorkOrder[]) => {
    if (orders.length === 0) return []

    // Extraer todos los años únicos de las fechas de los trabajos
    const years = new Set<string>()
    
    orders.forEach(order => {
      if (order.date) {
        try {
          const year = new Date(order.date).getFullYear().toString()
          if (year && year !== 'NaN') {
            years.add(year)
          }
        } catch (error) {
          console.warn(`Error parsing date for order ${order.id}:`, order.date)
        }
      }
    })

    // Convertir a array y ordenar de mayor a menor (más reciente primero)
    const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
    
    // Crear opciones para los selects
    const yearOptions = sortedYears.map(year => ({
      value: year,
      label: year
    }))

    console.log("🔍 Años disponibles generados:", yearOptions)
    return yearOptions
  }, [])

  // Add function to handle expenses
  const addExpense = () => {
    const newExpense = {
      id: Date.now().toString(),
      item: "",
      amount: "",
      amountCharged: "",
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

  const updateExpense = (id: string, field: "item" | "amount" | "amountCharged", value: string) => {
    setNewOrder({
      ...newOrder,
      expenses: newOrder.expenses.map((expense) => (expense.id === id ? { ...expense, [field]: value } : expense)),
    })
  }

  // Calculate total expenses automatically (using amount - costo real)
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
      amountCharged: "",
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

  const updateEditExpense = (id: string, field: "item" | "amount" | "amountCharged", value: string) => {
    setEditOrder({
      ...editOrder,
      expenses: editOrder.expenses.map((expense) => (expense.id === id ? { ...expense, [field]: value } : expense)),
    })
  }

  // Calculate total expenses for edit form (using amount - costo real)
  const calculateEditTotalExpenses = () => {
    return editOrder.expenses.reduce((total, expense) => {
      return total + (Number.parseFloat(expense.amount) || 0)
    }, 0)
  }

  // Función para calcular el costo total automáticamente
  const calculateTotalCost = (manoObra: number, expenses: { id: string; item: string; amount: string; amountCharged: string }[]) => {
    const totalGastos = expenses.reduce((sum, expense) => {
      const costoReal = parseFloat(expense.amount) || 0;
      return sum + costoReal;
    }, 0);
    
    // El costo total es solo mano de obra + gastos reales
    // NO incluir el markup, ya que eso es ganancia, no costo
    return manoObra + totalGastos;
  };

  // Función para calcular el costo total de una orden existente
  const calculateOrderTotalCost = (order: WorkOrder) => {
    // Si la orden ya tiene los nuevos campos, usarlos
    if (order.manoObra !== undefined && order.markupRepuestos !== undefined) {
      // El costo total es solo mano de obra + gastos reales
      return (order.manoObra || 0) + (order.expenses || 0);
    }
    
    // Si no tiene los nuevos campos, calcular basándose en los datos existentes
    if (order.expenseDetails && order.expenseDetails.length > 0) {
      const totalGastos = order.expenseDetails.reduce((sum, expense) => {
        const costoReal = parseFloat(expense.amount) || 0;
        return sum + costoReal;
      }, 0);
      
      // Si no hay mano de obra explícita, asumimos que la ganancia es la mano de obra
      const manoObra = order.profit || 0;
      
      // El costo total es solo mano de obra + gastos reales
      return manoObra + totalGastos;
    }
    
    // Fallback: usar el totalCost existente
    return order.totalCost || 0;
  };

  // Función para calcular la ganancia de una orden existente
  const calculateOrderProfit = (order: WorkOrder) => {
    // Si la orden ya tiene los nuevos campos, usar la nueva lógica
    if (order.manoObra !== undefined && order.markupRepuestos !== undefined) {
      // Ganancia = Mano de Obra + Markup de Repuestos
      return (order.manoObra || 0) + (order.markupRepuestos || 0);
    }
    
    // Si no tiene los nuevos campos, usar la lógica existente
    if (order.expenseDetails && order.expenseDetails.length > 0) {
      const totalMarkup = order.expenseDetails.reduce((sum, expense) => {
        const costoReal = parseFloat(expense.amount) || 0;
        const precioVenta = parseFloat(expense.amountCharged || expense.amount) || costoReal;
        return sum + (precioVenta - costoReal);
      }, 0);
      
      // Ganancia = Mano de Obra + Markup de Repuestos
      const manoObra = order.profit || 0;
      return manoObra + totalMarkup;
    }
    
    // Fallback: usar la ganancia existente
    return order.profit || 0;
  };



  // Calculate total markup from repuestos (ganancia extra de repuestos)
  const calculateTotalMarkup = () => {
    return newOrder.expenses.reduce((total, expense) => {
      if (expense.amountCharged && expense.amountCharged !== "" && expense.amount && expense.amount !== "") {
        const markup = Number.parseFloat(expense.amountCharged) - Number.parseFloat(expense.amount);
        return total + (markup > 0 ? markup : 0);
      }
      return total;
    }, 0);
  }

  // Calculate total markup for edit form
  const calculateEditTotalMarkup = () => {
    return editOrder.expenses.reduce((total, expense) => {
      if (expense.amountCharged && expense.amountCharged !== "" && expense.amount && expense.amount !== "") {
        const markup = Number.parseFloat(expense.amountCharged) - Number.parseFloat(expense.amount);
        return total + (markup > 0 ? markup : 0);
      }
      return total;
    }, 0);
  }

  // Calculate real profit for a work order (including markup from repuestos)
  const calculateRealProfit = (order: WorkOrder) => {
    console.log(`🔍 Calculando ganancia real para ${order.id}:`, {
      expenseDetails: order.expenseDetails,
      totalCost: order.totalCost,
      totalExpenses: order.expenses,
      profit: order.profit
    });

    if (!order.expenseDetails || order.expenseDetails.length === 0) {
      // Si no hay gastos detallados, usar la ganancia básica
      console.log(`🔍 No hay gastos detallados para ${order.id}, usando ganancia básica:`, order.profit);
      return order.profit || 0;
    }

    // Calcular ganancia real: Mano de Obra - Gastos Reales + Markup Repuestos
    const totalCost = order.totalCost || 0;
    const totalExpenses = order.expenses || 0;
    
    // Calcular markup total de repuestos
    const totalMarkup = order.expenseDetails.reduce((total, expense) => {
      const costoReal = Number(expense.amount) || 0;
      const precioCliente = Number(expense.amountCharged) || costoReal;
      const markup = precioCliente - costoReal;
      console.log(`🔍 Gasto ${expense.item}: costo real ${costoReal}, precio cliente ${precioCliente}, markup ${markup}`);
      return total + (markup > 0 ? markup : 0);
    }, 0);

    // Ganancia real = Mano de Obra + Markup de Repuestos
    // NO restar gastos porque ya están incluidos en el costo total
    const realProfit = totalMarkup;
    console.log(`🔍 Ganancia real para ${order.id}: markup ${totalMarkup} = ${realProfit}`);
    
    return realProfit;
  }

  // Check if order has markup from repuestos
  const hasMarkup = (order: WorkOrder) => {
    if (!order.expenseDetails || order.expenseDetails.length === 0) {
      return false;
    }

    return order.expenseDetails.some(expense => {
      const costoReal = Number(expense.amount) || 0;
      const precioCliente = Number(expense.amountCharged) || costoReal;
      return precioCliente > costoReal;
    });
  }

  // Get total markup for an order
  const getTotalMarkup = (order: WorkOrder) => {
    if (!order.expenseDetails || order.expenseDetails.length === 0) {
      return 0;
    }

    return order.expenseDetails.reduce((total, expense) => {
      const costoReal = Number(expense.amount) || 0;
      const precioCliente = Number(expense.amountCharged) || costoReal;
      const markup = precioCliente - costoReal;
      return total + (markup > 0 ? markup : 0);
    }, 0);
  }

  // Funciones para mecánicos
  const loadMechanics = useCallback(async () => {
    try {
      setIsLoadingMechanics(true)
      setMechanicsError(null)
      const mechanicsData = await mecanicosApi.getAll()
      
      console.log("🔍 Datos de la API:", mechanicsData)
      
      // Mapear los datos de la API a la interfaz Mechanic
      const mappedMechanics = mechanicsData.map((mecanico: any) => ({
        id: mecanico.id.toString(),
        name: mecanico.nombre,
        mechanic_id: `MC-${mecanico.id}`,
        jobs_completed: 0,
        total_commission: 0,
        total_profit: 0,
        hire_date: mecanico.fecha_contratacion || new Date().toISOString(),
        created_at: mecanico.created_at || new Date().toISOString(),
        updated_at: mecanico.updated_at || new Date().toISOString()
      }))
      
      console.log("🔍 Mecánicos mapeados:", mappedMechanics)
      
      setMechanics(mappedMechanics)
    } catch (error) {
      setMechanicsError('Error al cargar mecánicos')
      console.error('Error loading mechanics:', error)
    } finally {
      setIsLoadingMechanics(false)
    }
  }, [])

  const handleMechanicSelection = useCallback((selectedOptions: any) => {
    if (!selectedOptions) {
      setSelectedMechanics([])
      return
    }
    
    const selectedMechs = selectedOptions.map((option: any) => ({
      id_mecanico: parseInt(option.value),
      porcentaje_comision: 2.0 // 2% fijo como float
    }))
    setSelectedMechanics(selectedMechs)
  }, [])

  const calculateCommissionPreview = useCallback(() => {
    if (selectedMechanics.length === 0) return 0
    
    const manoObra = Number.parseFloat(newOrder.manoObra) || 0
    
    // ✅ CORRECTO: Comisión solo sobre la mano de obra (ganancia base del trabajo)
    const gananciaBase = manoObra
    
    if (gananciaBase <= 0) return 0
    
    // 2% de comisión SOLO sobre la mano de obra
    const comisionTotal = gananciaBase * 0.02
    const comisionPorMecanico = comisionTotal / selectedMechanics.length
    
    console.log("🔍 Calculando comisión (lógica corregida):", {
      manoObra,
      gananciaBase,
      comisionTotal,
      comisionPorMecanico,
      selectedMechanics: selectedMechanics.length
    })
    
    return comisionPorMecanico
  }, [selectedMechanics, newOrder.manoObra])

  // Calculate commission preview for edit modal (lógica corregida)
  const calculateEditCommissionPreview = useCallback(() => {
    if (selectedMechanics.length === 0) return 0
    
    const manoObra = Number.parseFloat(editOrder.manoObra) || 0
    
    // ✅ CORRECTO: Comisión solo sobre la mano de obra (ganancia base del trabajo)
    const gananciaBase = manoObra
    
    console.log("🔍 Calculando comisión para edición (lógica corregida):", {
      manoObra,
      gananciaBase,
      selectedMechanics: selectedMechanics.length
    })
    
    if (gananciaBase <= 0) return 0
    
    // 2% de comisión SOLO sobre la mano de obra
    const comisionTotal = gananciaBase * 0.02
    const comisionPorMecanico = comisionTotal / selectedMechanics.length
    
    console.log("🔍 Comisión calculada (lógica corregida):", {
      comisionTotal,
      comisionPorMecanico
    })
    
    return comisionPorMecanico
  }, [selectedMechanics, editOrder.manoObra])

  // Update the handleAddWorkOrder function
  const handleAddWorkOrder = async () => {
    if (newOrder.licensePlate && newOrder.description && newOrder.clientName) {
      try {
        // Calcular el costo total automáticamente
        const manoObra = Number.parseFloat(newOrder.manoObra) || 0
        const totalExpenses = calculateTotalExpenses()
        const totalMarkup = calculateTotalMarkup()
        // El costo total es solo mano de obra + gastos reales
        // NO incluir el markup, ya que eso es ganancia, no costo
        const costoTotalCalculado = manoObra + totalExpenses
        
        // Log de los datos que se van a enviar
        const datosTrabajo = {
          matricula_carro: newOrder.licensePlate,
          descripcion: newOrder.description,
          fecha: new Date().toISOString().split("T")[0],
          costo: costoTotalCalculado, // Usar el costo calculado automáticamente
          mano_obra: manoObra, // Nuevo campo
          markup_repuestos: totalMarkup, // Nuevo campo
          aplica_iva: newOrder.applyWork, // Solo aplicar IVA si está seleccionado
          detalle_gastos: newOrder.expenses.map(expense => ({
            descripcion: expense.item,
            monto: Number.parseFloat(expense.amount) || 0,
            monto_cobrado: expense.amountCharged && expense.amountCharged !== "" 
              ? Number.parseFloat(expense.amountCharged) 
              : Number.parseFloat(expense.amount) || 0
          }))
        }
        console.log("🔍 Datos que se envían a la API:", datosTrabajo)

        // Crear el trabajo primero
        const response = await fetch("http://localhost:8000/api/trabajos/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datosTrabajo),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Error al crear trabajo")
        }

        const trabajoCreado = await response.json()
        console.log("🔍 Respuesta completa de la API:", trabajoCreado)
        const trabajoId = trabajoCreado.id
        console.log("🔍 ID extraído:", trabajoId)
        console.log("🔍 Tipo de ID:", typeof trabajoId)

        // Validar que el ID sea válido
        if (!trabajoId || trabajoId === undefined || trabajoId === null) {
          console.error("❌ ERROR: ID del trabajo no válido:", trabajoId)
          throw new Error("No se pudo obtener el ID del trabajo creado")
        }

        // Si hay mecánicos seleccionados, asignarlos al trabajo y calcular comisiones
        if (selectedMechanics.length > 0) {
          try {
            console.log("🚨🚨🚨 FRONTEND: Intentando asignar mecánicos")
            console.log("🔍 Intentando asignar mecánicos:", selectedMechanics)
            console.log("🔍 ID del trabajo creado:", trabajoId)
            console.log("🔍 URL de la API:", `http://localhost:8000/api/mecanicos/trabajos/${trabajoId}/asignar`)
            
            // Log detallado de los datos que se envían
            console.log("🔍 Datos completos de selectedMechanics:", JSON.stringify(selectedMechanics, null, 2))
            console.log("🔍 Primer mecánico:", selectedMechanics[0])
            console.log("🔍 Tipo de selectedMechanics:", typeof selectedMechanics)
            console.log("🔍 Es un array:", Array.isArray(selectedMechanics))
            
            // Log adicional para debuggear
            console.log("🔍 Estructura del primer mecánico:")
            for (const [key, value] of Object.entries(selectedMechanics[0])) {
              console.log(`  - ${key}: ${value} (tipo: ${typeof value})`)
            }
            
            const asignacionResponse = await mecanicosApi.assignToWork(trabajoId, selectedMechanics)
            console.log("✅ Respuesta de asignación:", asignacionResponse)
            console.log(`✅ Mecánicos asignados al trabajo ${trabajoId}`)
          } catch (error) {
            console.error("❌ Error al asignar mecánicos:", error)
            console.error("❌ Detalles del error:", {
              trabajoId,
              selectedMechanics,
              error: error instanceof Error ? error.message : String(error)
            })
            // No fallar si no se pueden asignar mecánicos, solo loguear el error
          }
        } else {
          console.log("ℹ️ No hay mecánicos seleccionados para asignar")
        }

        // Reload work orders after adding
        await loadWorkOrders(1, true)

        // Reset form
        setNewOrder({
          licensePlate: "",
          description: "",
          totalCost: "",
          manoObra: "",
          clientName: "",
          expenses: [],
          applyWork: false,
        })
        setSelectedMechanics([]) // Reset selected mechanics
        setIsNewOrderModalOpen(false)
      } catch (error: any) {
        console.error("Error al crear trabajo:", error)
        alert(error.message || "Error inesperado")
      }
    }
  }

  // Add after handleAddWorkOrder function
  const handleSaveEditOrder = async () => {
    if (editOrder.description) {
      try {
        // Calcular el costo total automáticamente para edición
        const manoObra = Number.parseFloat(editOrder.manoObra) || 0
        const totalExpensesEdit = calculateEditTotalExpenses()
        const totalMarkupEdit = calculateEditTotalMarkup()
        // El costo total es solo mano de obra + gastos reales
        // NO incluir el markup, ya que eso es ganancia, no costo
        const costoTotalCalculado = manoObra + totalExpensesEdit

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
            costo: costoTotalCalculado, // Usar el costo calculado automáticamente
            mano_obra: manoObra, // Nuevo campo
            markup_repuestos: totalMarkupEdit, // Nuevo campo
            aplica_iva: editOrder.applyWork || false, // Solo aplicar IVA si está seleccionado
            detalle_gastos: editOrder.expenses.map(expense => ({
              descripcion: expense.item,
              monto: Number.parseFloat(expense.amount) || 0,
              monto_cobrado: expense.amountCharged && expense.amountCharged !== "" 
                ? Number.parseFloat(expense.amountCharged) 
                : Number.parseFloat(expense.amount) || 0
            }))
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Error al actualizar trabajo")
        }

        // Si hay mecánicos seleccionados, asignarlos al trabajo
        if (selectedMechanics.length > 0) {
          try {
            // Usar el endpoint de actualización de comisiones para edición
            const actualizacionResponse = await fetch(`http://localhost:8000/api/mecanicos/trabajos/${workOrderId}/actualizar-comisiones`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(selectedMechanics),
            })
            
            if (actualizacionResponse.ok) {
              const resultado = await actualizacionResponse.json()
              console.log("✅ Comisiones actualizadas para el trabajo:", resultado)
            } else {
              console.error("❌ Error al actualizar comisiones:", actualizacionResponse.status)
            }
          } catch (error) {
            console.error("❌ Error al actualizar comisiones:", error)
            // No fallar si no se pueden actualizar comisiones, solo loguear el error
          }
        }

        // Reload work orders after updating
        await loadWorkOrders(1, true)

        setEditOrder({
          id: "",
          description: "",
          totalCost: "",
          manoObra: "",
          expenses: [],
          applyWork: false,
        })
        setSelectedMechanics([]) // Reset selected mechanics
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

  // Load expense details for all work orders
  const loadExpenseDetails = async (orders: WorkOrder[]) => {
    try {
      const ordersWithExpenses = await Promise.all(
        orders.map(async (order) => {
          try {
            // Extraer el ID numérico del trabajo
            const workOrderId = parseInt(order.id.replace("WO-", ""))
            
            // Obtener los gastos detallados del backend
            const response = await fetch(`http://localhost:8000/api/trabajos/trabajo/${workOrderId}/gastos`)
            
            if (response.ok) {
              const responseData = await response.json()
              console.log(`🔍 Status HTTP para ${order.id}:`, response.status, response.statusText)
              console.log(`🔍 Headers de respuesta para ${order.id}:`, Object.fromEntries(response.headers.entries()))
              console.log(`🔍 Gastos para ${order.id}:`, responseData)
              console.log(`🔍 Tipo de responseData:`, typeof responseData, Array.isArray(responseData))
              console.log(`🔍 Contenido completo de responseData:`, JSON.stringify(responseData, null, 2))
              
              // Verificar que la respuesta sea un array válido o tenga la estructura esperada
              let expensesArray = []
              
              if (Array.isArray(responseData)) {
                // La API devuelve directamente un array
                expensesArray = responseData
              } else if (responseData && responseData.gastos && Array.isArray(responseData.gastos)) {
                // La API devuelve un objeto con la propiedad 'gastos'
                expensesArray = responseData.gastos
                console.log(`🔍 Gastos extraídos de responseData.gastos para ${order.id}:`, expensesArray)
              } else {
                console.warn(`🔍 Respuesta de la API no tiene estructura válida para ${order.id}:`, responseData)
                console.warn(`🔍 Contenido completo:`, JSON.stringify(responseData, null, 2))
                return {
                  ...order,
                  expenseDetails: []
                }
              }
              
              // Mapear los datos del backend al formato esperado por el frontend
              const mappedExpenses = expensesArray.map((expense: any) => ({
                id: expense.id,
                item: expense.descripcion,
                amount: expense.monto.toString(),
                amountCharged: expense.monto_cobrado ? expense.monto_cobrado.toString() : expense.monto.toString()
              }))
              
              console.log(`🔍 Mapped expenses para ${order.id}:`, mappedExpenses)
              
              // Calcular el costo total correcto: precioCliente + manoObra
              const totalPrecioCliente = mappedExpenses.reduce((total: number, expense: any) => {
                const precioCliente = Number(expense.amountCharged) || Number(expense.amount) || 0;
                return total + precioCliente;
              }, 0);
              
              const costoTotalCalculado = totalPrecioCliente + (order.manoObra || 0);
              
              console.log(`🔍 Costo total recalculado para ${order.id}:`, {
                totalPrecioCliente,
                manoObra: order.manoObra,
                costoTotalCalculado
              });
              
              // Actualizar los campos del trabajo si están disponibles
              return {
                ...order,
                expenseDetails: mappedExpenses,
                totalCost: costoTotalCalculado // ✅ Actualizar con el costo total correcto
              }
            } else {
              console.warn(`No se pudieron obtener gastos para ${order.id}`)
              return {
                ...order,
                expenseDetails: []
              }
            }
          } catch (error) {
            console.error(`Error al obtener gastos para ${order.id}:`, error)
            return order
          }
        })
      )
      
      // Actualizar el estado con los gastos detallados
      console.log("🔍 Actualizando estado con órdenes que incluyen totalCost recalculado:")
      ordersWithExpenses.forEach(order => {
        console.log(`🔍 ${order.id}: totalCost = ${order.totalCost}, expenseDetails = ${order.expenseDetails?.length || 0}`)
      })
      
      setWorkOrders(ordersWithExpenses)
      setFilteredWorkOrders(ordersWithExpenses)
      
      console.log("🔍 Estado actualizado. Órdenes con gastos detallados:", ordersWithExpenses)
    } catch (error) {
      console.error("Error al cargar gastos detallados:", error)
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
          manoObra: trabajo.mano_obra || 0,
          markupRepuestos: trabajo.markup_repuestos || 0,
          expenseDetails: [], // Inicialmente vacío, se cargará después
        }))

        if (reset) {
          setWorkOrders(transformedOrders)
          setFilteredWorkOrders(transformedOrders)
          
          // Generar opciones de años basándose en los datos reales
          const dynamicYearOptions = generateYearOptions(transformedOrders)
          setYearOptions(dynamicYearOptions)
        } else {
          setWorkOrders((prev) => [...prev, ...transformedOrders])
          setFilteredWorkOrders((prev) => [...prev, ...transformedOrders])
        }

        setTotalWorkOrders(transformedOrders.length)
        setHasMore(false) // No pagination for now
        setPage(pageNum)

        // Cargar gastos detallados para cada trabajo después de cargar la lista principal
        await loadExpenseDetails(transformedOrders)
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
    async (query: string, dateRange: { startMonth: string; startYear: string; endMonth: string; endYear: string }) => {
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
      if (dateRange.startMonth || dateRange.startYear || dateRange.endMonth || dateRange.endYear) {
        filtered = filtered.filter((order) => {
          const orderDate = new Date(order.date)
          const orderMonth = (orderDate.getMonth() + 1).toString().padStart(2, '0')
          const orderYear = orderDate.getFullYear().toString()
          
          // Check if order is within the selected month/year range
          if (dateRange.startMonth && dateRange.startYear) {
            if (orderYear < dateRange.startYear || (orderYear === dateRange.startYear && orderMonth < dateRange.startMonth)) {
              return false
            }
          }
          
          if (dateRange.endMonth && dateRange.endYear) {
            if (orderYear > dateRange.endYear || (orderYear === dateRange.endYear && orderMonth > dateRange.endMonth)) {
              return false
            }
          }
          
          return true
        })
      }

      setFilteredWorkOrders(filtered)
      setHasMore(false) // Disable infinite scroll during search/filter
      setIsSearching(false)
    },
    [workOrders],
  )

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim() && !dateFilter.startMonth && !dateFilter.startYear && !dateFilter.endMonth && !dateFilter.endYear) {
        setFilteredWorkOrders(workOrders)
        setHasMore(page < Math.ceil(totalWorkOrders / 10))
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      await new Promise((resolve) => setTimeout(resolve, 200))
      handleSearchAndFilter(query, dateFilter)
    },
    [workOrders, page, totalWorkOrders, dateFilter, handleSearchAndFilter],
  )

  const handleDateFilter = useCallback(
    (dateRange: { startMonth: string; startYear: string; endMonth: string; endYear: string }) => {
      if (!dateRange.startMonth && !dateRange.startYear && !dateRange.endMonth && !dateRange.endYear && !searchQuery.trim()) {
        setFilteredWorkOrders(workOrders)
        setHasMore(page < Math.ceil(totalWorkOrders / 10))
        return
      }

      handleSearchAndFilter(searchQuery, dateRange)
    },
    [workOrders, page, totalWorkOrders, searchQuery, handleSearchAndFilter],
  )

  const clearSearch = () => {
    setSearchQuery("")
    setDateFilter({ startMonth: "", startYear: "", endMonth: "", endYear: "" })
    setIsSearching(false)
    setFilteredWorkOrders(workOrders)
    setHasMore(page < Math.ceil(totalWorkOrders / 20))
  }

  // Initial load
  useEffect(() => {
    loadWorkOrders(1, true)
    loadAvailableData()
    loadMechanics() // Load mechanics on mount
  }, []) // Remove loadWorkOrders from dependencies to prevent infinite loop

  // Search effect with debounce - updated to handle date filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, handleSearch])

  // Date filter effect - immediate filtering without delay
  useEffect(() => {
    handleDateFilter(dateFilter)
  }, [dateFilter, handleDateFilter])

  // Infinite scroll handler
  const handleLoadMore = () => {
    if (!loading && hasMore && !searchQuery) {
      loadWorkOrders(page + 1)
    }
  }

  const handleViewWorkOrder = async (order: WorkOrder) => {
    try {
      // Extraer el ID numérico del trabajo (e.g., "WO-010" -> 10) - MOVIDO AL INICIO
      const workOrderId = parseInt(order.id.replace("WO-", ""))
      
      // Buscar la orden en el estado actual que ya tiene los gastos cargados
      const orderWithExpenses = workOrders.find(wo => wo.id === order.id) || order
      
      console.log("🔍 Orden encontrada en estado:", orderWithExpenses)
      console.log("🔍 ExpenseDetails en estado:", orderWithExpenses.expenseDetails)
      
      // Si la orden ya tiene gastos cargados, usarlos directamente
      let expenseDetails = orderWithExpenses.expenseDetails || []
      
      // Si no hay gastos cargados, intentar cargarlos del backend
      if (!expenseDetails || expenseDetails.length === 0) {
        console.log("🔍 No hay gastos en estado, cargando del backend...")
        
        try {
          const response = await fetch(`http://localhost:8000/api/trabajos/trabajo/${workOrderId}/gastos`)
          
                  if (response.ok) {
          const expenseDetailsData = await response.json()
          console.log("🔍 Status HTTP:", response.status, response.statusText)
          console.log("🔍 Gastos obtenidos del backend:", expenseDetailsData)
          console.log("🔍 Tipo de expenseDetailsData:", typeof expenseDetailsData, Array.isArray(expenseDetailsData))
          console.log("🔍 Contenido completo de expenseDetailsData:", JSON.stringify(expenseDetailsData, null, 2))
          
          // Verificar que la respuesta sea un array válido o tenga la estructura esperada
          let expensesArray = []
          
          if (Array.isArray(expenseDetailsData)) {
            // La API devuelve directamente un array
            expensesArray = expenseDetailsData
          } else if (expenseDetailsData && expenseDetailsData.gastos && Array.isArray(expenseDetailsData.gastos)) {
            // La API devuelve un objeto con la propiedad 'gastos'
            expensesArray = expenseDetailsData.gastos
            console.log("🔍 Gastos extraídos de expenseDetailsData.gastos:", expensesArray)
          } else {
            console.warn("🔍 Respuesta de la API no tiene estructura válida:", expenseDetailsData)
            console.warn("🔍 Contenido completo:", JSON.stringify(expenseDetailsData, null, 2))
            expenseDetails = []
            return
          }
          
          // Mapear los datos del backend al formato esperado por el frontend
          expenseDetails = expensesArray.map((expense: any) => {
            console.log("🔍 Procesando gasto para detalle:", expense)
            return {
              id: expense.id,
              item: expense.descripcion,
              amount: expense.monto.toString(),
              amountCharged: expense.monto_cobrado ? expense.monto_cobrado.toString() : expense.monto.toString()
            }
          })
          console.log("🔍 Gastos mapeados:", expenseDetails)
        } else {
          console.warn("No se pudieron obtener los gastos detallados")
          expenseDetails = []
        }
        } catch (error) {
          console.error("Error al obtener gastos detallados:", error)
        }
      }
      
      // Obtener los mecánicos asignados al trabajo
      let assignedMechanics = []
      try {
        const mechanicsResponse = await fetch(`http://localhost:8000/api/mecanicos/trabajos/${workOrderId}/asignados`)
        
        if (mechanicsResponse.ok) {
          const mechanicsData = await mechanicsResponse.json()
          console.log("🔍 Mecánicos asignados obtenidos:", mechanicsData)
          assignedMechanics = mechanicsData
        } else {
          console.warn("No se pudieron obtener los mecánicos asignados")
        }
      } catch (error) {
        console.error("Error al obtener mecánicos asignados:", error)
      }
      
      // Actualizar la orden con los gastos detallados y mecánicos asignados
      const orderWithDetails = {
        ...order,
        expenseDetails: expenseDetails,
        assignedMechanics: assignedMechanics
      }
      
      console.log("🔍 Orden con detalles completos:", orderWithDetails)
      setSelectedWorkOrder(orderWithDetails)
    } catch (error) {
      console.error("Error al obtener detalles de la orden:", error)
      // En caso de error, mostrar la orden sin detalles
      setSelectedWorkOrder(order)
    }
    
    setIsDetailModalOpen(true)
  }

  // Add after handleViewWorkOrder function
  const handleEditWorkOrder = async (order: WorkOrder) => {
    console.log("🔍 Iniciando edición de orden:", order.id)
    
    // Extraer el ID numérico del trabajo (e.g., "WO-010" -> 10)
    const workOrderId = parseInt(order.id.replace("WO-", ""))
    
    // Obtener los gastos detallados del backend para edición
    let expensesToEdit = []
    try {
      const response = await fetch(`http://localhost:8000/api/trabajos/trabajo/${workOrderId}/gastos`)
      
      if (response.ok) {
        const expenseDetails = await response.json()
        console.log("🔍 Gastos obtenidos para edición:", expenseDetails)
        console.log("🔍 Tipo de expenseDetails:", typeof expenseDetails, Array.isArray(expenseDetails))
        
        // Verificar que la respuesta sea un array válido o tenga la estructura esperada
        let expensesArray = []
        
        if (Array.isArray(expenseDetails)) {
          // La API devuelve directamente un array
          expensesArray = expenseDetails
        } else if (expenseDetails && expenseDetails.gastos && Array.isArray(expenseDetails.gastos)) {
          // La API devuelve un objeto con la propiedad 'gastos'
          expensesArray = expenseDetails.gastos
          console.log("🔍 Gastos extraídos de expenseDetails.gastos para edición:", expensesArray)
        } else {
          console.warn("🔍 Respuesta de la API no tiene estructura válida para edición:", expenseDetails)
          expensesToEdit = [
            { id: "1", item: "", amount: "", amountCharged: "" },
            { id: "2", item: "", amount: "", amountCharged: "" }
          ]
          return
        }
        
        expensesToEdit = expensesArray.map((expense: any) => {
          console.log("🔍 Procesando gasto:", expense)
          return {
            id: expense.id,
            item: expense.descripcion,
            amount: expense.monto.toString(),
            amountCharged: expense.monto_cobrado ? expense.monto_cobrado.toString() : expense.monto.toString()
          }
        })
        console.log("🔍 Gastos mapeados para edición:", expensesToEdit)
      } else {
        // Si no se pueden obtener los gastos, crear gastos vacíos para edición
        console.warn("No se pudieron obtener los gastos detallados para edición")
        expensesToEdit = [
          { id: "1", item: "", amount: "", amountCharged: "" },
          { id: "2", item: "", amount: "", amountCharged: "" }
        ]
      }
    } catch (error) {
      console.warn("Error al obtener gastos detallados:", error)
      expensesToEdit = [
        { id: "1", item: "", amount: "", amountCharged: "" },
        { id: "2", item: "", amount: "", amountCharged: "" }
      ]
    }

    // Obtener los mecánicos asignados al trabajo
    try {
      console.log("🔍 Obteniendo mecánicos asignados para trabajo:", workOrderId)
      const mechanicsResponse = await fetch(`http://localhost:8000/api/mecanicos/trabajos/${workOrderId}/asignados`)
      console.log("🔍 Response status:", mechanicsResponse.status)
      
      if (mechanicsResponse.ok) {
        const mechanicsData = await mechanicsResponse.json()
        console.log("🔍 Mecánicos obtenidos del backend:", mechanicsData)
        
        const assignedMechanics = mechanicsData.map((mechanic: any) => ({
          id_mecanico: mechanic.id_mecanico,
          porcentaje_comision: mechanic.porcentaje_comision || 2.0
        }))
        console.log("🔍 Mecánicos mapeados para selectedMechanics:", assignedMechanics)
        
        setSelectedMechanics(assignedMechanics)
        console.log("🔍 selectedMechanics establecido:", assignedMechanics)
        
        // Verificar que se estableció correctamente
        setTimeout(() => {
          console.log("🔍 Verificación - selectedMechanics después de setState:", assignedMechanics)
        }, 100)
      } else {
        console.warn("❌ No se pudieron obtener los mecánicos asignados. Status:", mechanicsResponse.status)
        setSelectedMechanics([])
      }
    } catch (error) {
      console.warn("❌ Error al obtener mecánicos asignados:", error)
      setSelectedMechanics([])
    }

    const editOrderData = {
      id: order.id,
      description: order.description,
      totalCost: order.totalCost.toString(),
      manoObra: order.manoObra ? order.manoObra.toString() : "",
      expenses: expensesToEdit,
      applyWork: false, // Por defecto no aplicar IVA en edición
    }
    console.log("🔍 Datos del editOrder a establecer:", editOrderData)
    setEditOrder(editOrderData)
    setIsEditModalOpen(true)
  }

  const handlePrintWorkOrder = async (order: WorkOrder) => {
    setSelectedOrderForPrint(order)
    setIsPrintOptionsModalOpen(true)
  }

  const handlePrintInvoice = async () => {
    if (!selectedOrderForPrint) return
    
    try {
      console.log("🖨️ Imprimiendo factura para:", selectedOrderForPrint.id)
      
      // Crear una ventana de impresión con el contenido de la factura
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert("Por favor, permite las ventanas emergentes para imprimir")
        return
      }

      // Crear el contenido HTML para imprimir la factura
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Factura ${selectedOrderForPrint.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .invoice-info { margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; margin-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; font-size: 18px; border-top: 1px solid #000; padding-top: 10px; }
            .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Auto Andrade</h1>
            <h2>FACTURA</h2>
            <p>Orden: ${selectedOrderForPrint.id}</p>
            <p>Fecha: ${new Date(selectedOrderForPrint.date).toLocaleDateString('es-ES')}</p>
          </div>
          
          <div class="invoice-info">
            <div class="section">
              <div class="section-title">Información del Cliente</div>
              <div class="row">
                <span>Nombre:</span>
                <span>${selectedOrderForPrint.clientName}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Información del Vehículo</div>
              <div class="row">
                <span>Placa:</span>
                <span>${selectedOrderForPrint.licensePlate}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Servicios Realizados</div>
              <p>${selectedOrderForPrint.description}</p>
            </div>
            
            <div class="section">
              <div class="section-title">Detalle de Costos</div>
              <table class="table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Servicios</td>
                    <td>${formatCurrency(selectedOrderForPrint.manoObra || 0)}</td>
                  </tr>
                  ${selectedOrderForPrint.expenses && selectedOrderForPrint.expenses > 0 ? `
                  <tr>
                    <td>Repuestos y Materiales</td>
                    <td>${formatCurrency(selectedOrderForPrint.expenses)}</td>
                  </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
            
            <div class="total">
              <div class="row">
                <span>TOTAL A PAGAR:</span>
                <span>${formatCurrency((selectedOrderForPrint.manoObra || 0) + (selectedOrderForPrint.expenses || 0))}</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 40px; text-align: center;">
            <p>Firma del Cliente: _________________________</p>
            <p>Firma del Representante: _________________________</p>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
      
      setIsPrintOptionsModalOpen(false)
      
    } catch (error) {
      console.error("Error al imprimir la factura:", error)
      alert("Error al imprimir la factura. Inténtalo de nuevo.")
    }
  }

  const handleGeneratePDF = async () => {
    if (!selectedOrderForPrint) return
    
    try {
      console.log("📄 Generando PDF para:", selectedOrderForPrint.id)
      
      // Simular generación de PDF
      alert(`Generando PDF para la orden ${selectedOrderForPrint.id}...`)
      
      // TODO: Implementar generación real de PDF
      // const response = await fetch('/api/generate-pdf', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ orderId: selectedOrderForPrint.id })
      // })
      
      setIsPrintOptionsModalOpen(false)
      
    } catch (error) {
      console.error("Error al generar PDF:", error)
      alert("Error al generar PDF. Inténtalo de nuevo.")
    }
  }

  const handleGenerateElectronicInvoice = async () => {
    if (!selectedOrderForPrint) return
    
    try {
      console.log("⚡ Generando factura electrónica para:", selectedOrderForPrint.id)
      
      // Simular generación de factura electrónica
      alert(`Generando factura electrónica para la orden ${selectedOrderForPrint.id}...`)
      
      // TODO: Implementar generación real de factura electrónica
      // const response = await fetch('/api/generate-electronic-invoice', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ orderId: selectedOrderForPrint.id })
      // })
      
      setIsPrintOptionsModalOpen(false)
      
    } catch (error) {
      console.error("Error al generar factura electrónica:", error)
      alert("Error al generar factura electrónica. Inténtalo de nuevo.")
    }
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
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
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
                  placeholder="Descripción del trabajo"
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Mecánicos Asignados */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Mecánicos Asignados al Trabajo
                </Label>
                
                {isLoadingMechanics ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-muted-foreground">Cargando mecánicos...</span>
                  </div>
                ) : mechanicsError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{mechanicsError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadMechanics}
                      className="mt-2"
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Select
                      isMulti
                      options={mechanics.map(mechanic => ({
                        value: mechanic.id,
                        label: `${mechanic.name} (${mechanic.mechanic_id})`
                      }))}
                      onChange={handleMechanicSelection}
                      placeholder="Seleccionar mecánicos..."
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
                    
                    {selectedMechanics.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Mecánicos Seleccionados: {selectedMechanics.length}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {selectedMechanics.map((selected, index) => {
                            const mechanic = mechanics.find(m => m.id === selected.id_mecanico.toString())
                            return (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-blue-700">
                                  {mechanic ? `${mechanic.name} (${mechanic.mechanic_id})` : 'Mecánico no encontrado'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {selected.porcentaje_comision}% comisión
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                        
                        {newOrder.totalCost && (
                          <div className="mt-3 pt-2 border-t border-blue-200">
                            <div className="flex items-center gap-2 text-sm">
                              <Wrench className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-700">Comisión por mecánico:</span>
                              <span className="font-medium text-blue-800">
                                ₡ {calculateCommissionPreview().toLocaleString("es-CR")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Expenses Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Gastos y Materiales (Costo Real / Precio Cliente)</Label>
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
                    {/* Header de columnas */}
                    <div className="flex gap-2 items-center text-xs font-medium text-gray-600 pb-2 border-b">
                      <div className="flex-1">Descripción</div>
                      <div className="w-32 text-center">Costo Real</div>
                      <div className="w-32 text-center">Precio Cliente</div>
                      <div className="w-24 text-center">Ganancia</div>
                      <div className="w-10"></div>
                    </div>
                    {newOrder.expenses.map((expense, index) => (
                      <div key={expense.id} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="Gasto"
                            value={expense.item}
                            onChange={(e) => updateExpense(expense.id, "item", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="₡ 0.00"
                            value={expense.amount}
                            onChange={(e) => updateExpense(expense.id, "amount", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="₡ 0.00"
                            value={expense.amountCharged}
                            onChange={(e) => updateExpense(expense.id, "amountCharged", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-24 text-center text-sm font-medium text-green-600">
                          {expense.amountCharged && expense.amount && expense.amountCharged !== "" && expense.amount !== "" 
                            ? `+₡${(Number(expense.amountCharged) - Number(expense.amount)).toLocaleString()}`
                            : '₡0'
                          }
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

              {/* Mano de Obra */}
              <div className="space-y-2">
                <Label htmlFor="manoObra" className="text-sm font-medium">
                  Mano de Obra
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">₡</span>
                  <Input
                    id="manoObra"
                    type="text"
                    inputMode="decimal"
                    value={newOrder.manoObra}
                    onChange={(e) => setNewOrder({ ...newOrder, manoObra: e.target.value })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Costo de la mano de obra del mecánico
                </p>

                {/* Profit Calculation Display */}
                {(newOrder.manoObra || newOrder.expenses.length > 0) && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Mano de Obra:</span>
                        <span className="font-medium">
                          ₡ {Number.parseFloat(newOrder.manoObra || "0").toLocaleString("es-CR")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Costos totales:</span>
                        <span className="text-red-600">₡ {calculateTotalExpenses().toLocaleString("es-CR")}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Precio cliente:</span>
                        <span className="font-medium">₡ {(() => {
                          // Precio cliente = suma de todos los precios cobrados al cliente
                          return newOrder.expenses.reduce((total, expense) => {
                            const precioCliente = expense.amountCharged && expense.amountCharged !== "" 
                              ? Number.parseFloat(expense.amountCharged) 
                              : Number.parseFloat(expense.amount) || 0;
                            return total + precioCliente;
                          }, 0);
                        })().toLocaleString("es-CR")}</span>
                      </div>
                      <div className="flex justify-between text-blue-600 pt-1 border-t">
                        <span>Ganancia Base:</span>
                        <span className="font-medium">
                          ₡ {(Number.parseFloat(newOrder.manoObra || "0") - calculateTotalExpenses()).toLocaleString("es-CR")}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600 pt-1 border-t">
                        <span>Ganancia:</span>
                        <span className="font-medium">
                          ₡ {(() => {
                            const manoObra = Number.parseFloat(newOrder.manoObra || "0");
                            const gastos = calculateTotalExpenses();
                            const gananciaBase = manoObra - gastos;
                            const markup = calculateTotalMarkup();
                            return gananciaBase + markup;
                          })().toLocaleString("es-CR")}
                        </span>
                      </div>
                      <div className="flex justify-between text-purple-600 pt-1 border-t">
                        <span>Costo Total:</span>
                        <span className="font-medium">
                          ₡ {(() => {
                            const manoObra = Number.parseFloat(newOrder.manoObra || "0");
                            const precioCliente = newOrder.expenses.reduce((total, expense) => {
                              const precio = expense.amountCharged && expense.amountCharged !== "" 
                                ? Number.parseFloat(expense.amountCharged) 
                                : Number.parseFloat(expense.amount) || 0;
                              return total + precio;
                            }, 0);
                            return precioCliente + manoObra;
                          })().toLocaleString("es-CR")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Costo Total (Campo oculto para compatibilidad) */}
              <input 
                type="hidden" 
                value={calculateTotalCost(Number.parseFloat(newOrder.manoObra || "0"), newOrder.expenses)}
              />

              {/* Apply IVA Option */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Opciones de Facturación</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="applyWork"
                    checked={newOrder.applyWork}
                    onChange={(e) => setNewOrder({ ...newOrder, applyWork: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="applyWork" className="text-sm">
                    Aplicar IVA (*13%)
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
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsNewOrderModalOpen(false)
                  setSelectedMechanics([]) // Reset selected mechanics
                }} 
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddWorkOrder}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                disabled={!newOrder.licensePlate || !newOrder.description}
              >
                Crear Orden de Trabajo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Order Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          setIsEditModalOpen(open)
          if (open) {
            // Cargar mecánicos cuando se abre el modal
            loadMechanics()
          }
        }}>
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
                  <Label className="text-sm font-medium">Gastos y Materiales (Costo Real / Precio Cliente)</Label>
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
                    {/* Header de columnas */}
                    <div className="flex gap-2 items-center text-xs font-medium text-gray-600 pb-2 border-b">
                      <div className="flex-1">Descripción</div>
                      <div className="w-32 text-center">Costo Real</div>
                      <div className="w-32 text-center">Precio Cliente</div>
                      <div className="w-24 text-center">Ganancia</div>
                      <div className="w-10"></div>
                    </div>
                    {editOrder.expenses.map((expense, index) => (
                      <div key={expense.id} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="Gasto"
                            value={expense.item}
                            onChange={(e) => updateEditExpense(expense.id, "item", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="₡ 0.00"
                            value={expense.amount}
                            onChange={(e) => updateEditExpense(expense.id, "amount", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="₡ 0.00"
                            value={expense.amountCharged}
                            onChange={(e) => updateEditExpense(expense.id, "amountCharged", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-24 text-center text-sm font-medium text-green-600">
                          {expense.amountCharged && expense.amount && expense.amountCharged !== "" && expense.amount !== "" 
                            ? `+₡${(Number(expense.amountCharged) - Number(expense.amount)).toLocaleString()}`
                            : '₡0'
                          }
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
                        <span>Costo repuestos:</span>
                        <span className="text-red-600">₡ {calculateEditTotalExpenses().toLocaleString("es-CR")}</span>
                      </div>
                      {calculateEditTotalMarkup() > 0 && (
                        <div className="flex justify-between items-center text-sm font-medium text-green-600">
                          <span>Añadido por repuestos:</span>
                          <span className="font-medium">+₡ {calculateEditTotalMarkup().toLocaleString("es-CR")}</span>
                        </div>
                      )}
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
                  Costo Total Cobrado al Cliente
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">₡</span>
                  <Input
                    id="editTotalCost"
                    type="text"
                    inputMode="decimal"
                    value={editOrder.totalCost}
                    onChange={(e) => setEditOrder({ ...editOrder, totalCost: e.target.value })}
                    placeholder="0.00 (opcional para proyectos en curso)"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Deja vacío si es un proyecto en curso que acumulará gastos gradualmente
                </p>

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
                        <span>Costo repuestos:</span>
                        <span className="text-red-600">₡ {calculateEditTotalExpenses().toLocaleString("es-CR")}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>Ganancia Base:</span>
                        <span className="font-medium">
                          ₡ {(Number.parseFloat(editOrder.manoObra || "0")).toLocaleString("es-CR")}
                        </span>
                      </div>
                      {calculateEditTotalMarkup() > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Añadido por repuestos:</span>
                          <span className="font-medium">+₡ {calculateEditTotalMarkup().toLocaleString("es-CR")}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium pt-1 border-t">
                        <span>Ganancia Total Estimada:</span>
                        <span
                          className={`${(Number.parseFloat(editOrder.manoObra || "0") + calculateEditTotalMarkup()) >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ₡{" "}
                          {(
                            Number.parseFloat(editOrder.manoObra || "0") + calculateEditTotalMarkup()
                          ).toLocaleString("es-CR")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mechanics Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Mecánicos Asignados</Label>
                  <p className="text-xs text-muted-foreground">
                    Puedes agregar más mecánicos al proyecto
                  </p>
                </div>

                {/* Current Mechanics Display - Mostrar primero los mecánicos ya asignados */}
                {selectedMechanics.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Mecánicos Actuales</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3 bg-blue-50">
                      {selectedMechanics.map((mechanic, index) => {
                        const mechanicInfo = mechanics.find(m => m.id === mechanic.id_mecanico.toString())
                        return (
                          <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-800">
                                {mechanicInfo?.name || `Mecánico ${mechanic.id_mecanico}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                {mechanic.porcentaje_comision}% comisión
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Asignado
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Commission Preview */}
                    {editOrder.totalCost && (
                      <div className="mt-3 pt-2 border-t border-blue-200">
                        <div className="flex items-center gap-2 text-sm">
                          <Wrench className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-700">Comisión por mecánico:</span>
                          <span className="font-medium text-blue-800">
                            ₡ {calculateEditCommissionPreview().toLocaleString("es-CR")}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Basado en: Mano de Obra
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mechanics Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {selectedMechanics.length > 0 ? "Modificar Selección de Mecánicos" : "Seleccionar Mecánicos"}
                  </Label>
                  {isLoadingMechanics ? (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-sm text-muted-foreground">Cargando mecánicos...</span>
                    </div>
                  ) : mechanicsError ? (
                    <div className="text-red-600 text-sm">{mechanicsError}</div>
                  ) : (
                    <Select
                      isMulti
                      options={mechanics.map((mechanic) => ({
                        value: mechanic.id,
                        label: `${mechanic.name} (${mechanic.mechanic_id})`,
                      }))}
                      value={selectedMechanics.map((mechanic) => {
                        const mechanicInfo = mechanics.find(m => m.id === mechanic.id_mecanico.toString())
                        return {
                          value: mechanic.id_mecanico.toString(),
                          label: mechanicInfo?.name || `Mecánico ${mechanic.id_mecanico}`,
                        }
                      })}
                      onChange={(selectedOptions) => {
                        const newMechanics = selectedOptions?.map((option) => ({
                          id_mecanico: parseInt(option.value),
                          porcentaje_comision: 2.0, // Porcentaje por defecto
                        })) || []
                        setSelectedMechanics(newMechanics)
                      }}
                      placeholder={selectedMechanics.length > 0 ? "Modificar selección..." : "Selecciona los mecánicos..."}
                      className="text-sm"
                      classNamePrefix="react-select"
                    />
                  )}
                  
                  {selectedMechanics.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No hay mecánicos asignados a este trabajo
                    </div>
                  )}
                </div>
              </div>

              {/* Apply IVA Option */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Opciones de Facturación</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editApplyWork"
                    checked={editOrder.applyWork}
                    onChange={(e) => setEditOrder({ ...editOrder, applyWork: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="editApplyWork" className="text-sm">
                    Aplicar IVA (*13%)
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEditOrder}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                disabled={!editOrder.description}
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
              {(searchQuery || dateFilter.startMonth || dateFilter.startYear || dateFilter.endMonth || dateFilter.endYear) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isSearching ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Buscando...</span>
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
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Desde:
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      placeholder="Mes"
                      options={monthOptions}
                      value={monthOptions.find(option => option.value === dateFilter.startMonth) || null}
                      onChange={(option) => setDateFilter({ ...dateFilter, startMonth: option?.value || "" })}
                      className="w-24 text-sm font-medium"
                      classNamePrefix="react-select"
                      isClearable={false}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: 'white',
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#9ca3af'
                          }
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: '#1f2937',
                          fontWeight: '500'
                        })
                      }}
                    />
                    <Select
                      placeholder="Año"
                      options={yearOptions}
                      value={yearOptions.find(option => option.value === dateFilter.startYear) || null}
                      onChange={(option) => setDateFilter({ ...dateFilter, startYear: option?.value || "" })}
                      className="w-20 text-sm font-medium"
                      classNamePrefix="react-select"
                      isClearable={false}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: 'white',
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#9ca3af'
                          }
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: '#1f2937',
                          fontWeight: '500'
                        })
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Hasta:
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      placeholder="Mes"
                      options={monthOptions}
                      value={monthOptions.find(option => option.value === dateFilter.endMonth) || null}
                      onChange={(option) => setDateFilter({ ...dateFilter, endMonth: option?.value || "" })}
                      className="w-24 text-sm font-medium"
                      classNamePrefix="react-select"
                      isClearable={false}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: 'white',
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#9ca3af'
                          }
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: '#1f2937',
                          fontWeight: '500'
                        })
                      }}
                    />
                    <Select
                      placeholder="Año"
                      options={yearOptions}
                      value={yearOptions.find(option => option.value === dateFilter.endYear) || null}
                      onChange={(option) => setDateFilter({ ...dateFilter, endYear: option?.value || "" })}
                      className="w-20 text-sm font-medium"
                      classNamePrefix="react-select"
                      isClearable={false}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: 'white',
                          borderColor: '#d1d5db',
                          '&:hover': {
                            borderColor: '#9ca3af'
                          }
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: '#1f2937',
                          fontWeight: '500'
                        })
                      }}
                    />
                  </div>
                </div>
                {(dateFilter.startMonth || dateFilter.startYear || dateFilter.endMonth || dateFilter.endYear) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateFilter({ startMonth: "", startYear: "", endMonth: "", endYear: "" })}
                    className="bg-transparent text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Search and Filter Results Summary */}
            {(searchQuery || dateFilter.startMonth || dateFilter.startYear || dateFilter.endMonth || dateFilter.endYear) && !isSearching && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="outline" className="text-xs">
                    Búsqueda: "{searchQuery}"
                  </Badge>
                )}
                {dateFilter.startMonth && dateFilter.startYear && (
                  <Badge variant="outline" className="text-xs">
                    Desde: {monthOptions.find(m => m.value === dateFilter.startMonth)?.label} {dateFilter.startYear}
                  </Badge>
                )}
                {dateFilter.endMonth && dateFilter.endYear && (
                  <Badge variant="outline" className="text-xs">
                    Hasta: {monthOptions.find(m => m.value === dateFilter.endMonth)?.label} {dateFilter.endYear}
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
                          <Coins className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            {formatCurrency(order.totalCost)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            Ganancia: {formatCurrency((order.manoObra || 0) - (order.expenses || 0) + (order.markupRepuestos || 0))}
                          </div>
                          {order.expenseDetails && order.expenseDetails.length > 0 && (
                            <div className="text-xs text-blue-600">
                              Gastos: {formatCurrency(order.expenses)}
                            </div>
                          )}
                          {hasMarkup(order) && (
                            <div className="text-xs text-green-600">
                              +{formatCurrency(getTotalMarkup(order))} markup
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop actions and cost */}
                    <div className="hidden sm:flex sm:items-center sm:gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                          <Coins className="h-4 w-4" />
                          {formatCurrency(order.totalCost)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ganancia: {formatCurrency((order.manoObra || 0) - (order.expenses || 0) + (order.markupRepuestos || 0))}
                        </div>
                        {order.expenseDetails && order.expenseDetails.length > 0 && (
                          <div className="text-xs text-blue-600">
                            Gastos: {formatCurrency(order.expenses)}
                          </div>
                        )}
                        {hasMarkup(order) && (
                          <div className="text-xs text-green-600">
                            +{formatCurrency(getTotalMarkup(order))}
                          </div>
                        )}
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
                          className="hover:bg-blue-50 hover:text-blue-600 bg-transparent p-1 sm:p-2 h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handlePrintWorkOrder(order)}
                          title="Imprimir orden"
                        >
                          <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
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
                        className="hover:bg-blue-50 hover:text-blue-600 bg-transparent p-1 h-7 w-7"
                        onClick={() => handlePrintWorkOrder(order)}
                        title="Imprimir orden"
                      >
                        <Printer className="h-3 w-3" />
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
                {!searchQuery && !dateFilter.startMonth && !dateFilter.startYear && !dateFilter.endMonth && !dateFilter.endYear && hasMore && (
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
                {!searchQuery && !dateFilter.startMonth && !dateFilter.startYear && !dateFilter.endMonth && !dateFilter.endYear && !hasMore && workOrders.length > 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    ✅ Se han cargado todas las {totalWorkOrders} órdenes de trabajo
                  </div>
                )}

                {/* Search/Filter results empty state */}
                {(searchQuery || dateFilter.startMonth || dateFilter.startYear || dateFilter.endMonth || dateFilter.endYear) &&
                  !isSearching &&
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
                  !dateFilter.startMonth &&
                  !dateFilter.startYear &&
                  !dateFilter.endMonth &&
                  !dateFilter.endYear &&
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
                    <Coins className="h-4 w-4" />
                    Detalle de Gastos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    console.log("🔍 Debug - selectedWorkOrder:", selectedWorkOrder);
                    console.log("🔍 Debug - expenseDetails:", selectedWorkOrder?.expenseDetails);
                    console.log("🔍 Debug - expenseDetails length:", selectedWorkOrder?.expenseDetails?.length);
                    console.log("🔍 Debug - expenseDetails type:", typeof selectedWorkOrder?.expenseDetails);
                    console.log("🔍 Debug - expenseDetails isArray:", Array.isArray(selectedWorkOrder?.expenseDetails));
                    return null;
                  })()}
                  {selectedWorkOrder.expenseDetails && selectedWorkOrder.expenseDetails.length > 0 ? (
                    <div className="space-y-2">
                      {/* Header de columnas */}
                      <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 pb-2 border-b">
                        <div>Descripción</div>
                        <div className="text-center">Costo Real</div>
                        <div className="text-center">Precio Cliente</div>
                        <div className="text-center">Ganancia</div>
                      </div>

                      {/* Mostrar gastos con costo real y precio cliente */}
                      {selectedWorkOrder.expenseDetails.map((expense) => {
                        const costoReal = Number(expense.amount) || 0;
                        const precioCliente = Number(expense.amountCharged) || costoReal;
                        const ganancia = precioCliente - costoReal;
                        
                        return (
                          <div
                            key={expense.id}
                            className="grid grid-cols-4 gap-2 items-center py-2 border-b last:border-b-0 text-sm"
                          >
                            <span className="font-medium">{expense.item}</span>
                            <span className="text-center text-red-600">{formatCurrency(costoReal)}</span>
                            <span className="text-center text-blue-600">{formatCurrency(precioCliente)}</span>
                            <span className={`text-center font-medium ${ganancia > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                              {ganancia > 0 ? `+${formatCurrency(ganancia)}` : '₡0'}
                            </span>
                          </div>
                        );
                      })}

                      {/* Totales */}
                      <div className="space-y-2 pt-3 border-t">
                        {/* Total Gastos (Costo Real) */}
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm font-medium">Total Gastos (Respuestos/Materiales):</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(selectedWorkOrder.expenses)}
                          </span>
                        </div>

                        {/* Total Gastos Cobrados al Cliente */}
                        {(() => {
                          const totalCobrado = selectedWorkOrder.expenseDetails.reduce((total, expense) => {
                            return total + (Number(expense.amountCharged) || Number(expense.amount) || 0);
                          }, 0);
                          return (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm font-medium">Precio Cliente:</span>
                              <span className="font-semibold text-blue-600">
                                {formatCurrency(totalCobrado)}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Ganancia por Repuestos */}
                        {(() => {
                          const gananciaRepuestos = selectedWorkOrder.expenseDetails.reduce((total, expense) => {
                            const costoReal = Number(expense.amount) || 0;
                            const precioCliente = Number(expense.amountCharged) || costoReal;
                            const ganancia = precioCliente - costoReal;
                            return total + (ganancia > 0 ? ganancia : 0);
                          }, 0);
                          
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

                        {/* Mano de Obra */}
                        <div className="flex justify-between py-2 border-t">
                          <span className="text-sm font-medium">Mano de Obra:</span>
                          <span className="font-semibold text-lg text-blue-600">
                            {formatCurrency(selectedWorkOrder.manoObra || 0)}
                          </span>
                        </div>

                        {/* Ganancia Base (Mano de Obra - Costo Real de Repuestos) */}
                        <div className="flex justify-between py-1">
                          <span className="text-sm font-medium">Ganancia Base:</span>
                          <span className="font-semibold text-blue-600">
                            {(() => {
                              // Ganancia Base = Mano de Obra - Costo Real de Repuestos
                              // Ejemplo: 80000 (mano de obra) - 50000 (costo real) = 30000
                              const manoObra = selectedWorkOrder.manoObra || 0;
                              const gananciaBase = manoObra - selectedWorkOrder.expenses;
                              
                              return formatCurrency(gananciaBase);
                            })()}
                          </span>
                        </div>

                        {/* Ganancia Neta (Ganancia Base + Markup de Repuestos) */}
                        <div className="flex justify-between py-1">
                          <span className="text-sm font-medium">Ganancia Neta:</span>
                          <span className="font-semibold text-lg text-green-600">
                            {(() => {
                              // Ganancia Base = Mano de Obra - Costo Real de Repuestos
                              const manoObra = selectedWorkOrder.manoObra || 0;
                              const gananciaBase = manoObra - selectedWorkOrder.expenses;
                              
                              // Calcular markup de repuestos (ganancia por repuestos)
                              const gananciaRepuestos = selectedWorkOrder.expenseDetails.reduce((total, expense) => {
                                const costoReal = Number(expense.amount) || 0;
                                const precioCliente = Number(expense.amountCharged) || costoReal;
                                const ganancia = precioCliente - costoReal;
                                return total + (ganancia > 0 ? ganancia : 0);
                              }, 0);
                              
                              // Ganancia Neta = Ganancia Base + Markup de Repuestos
                              // Ejemplo: 30000 (ganancia base) + 20000 (markup) = 50000
                              const gananciaNeta = gananciaBase + gananciaRepuestos;
                              
                              return formatCurrency(gananciaNeta);
                            })()}
                          </span>
                        </div>

                        {/* Mecánicos Asignados y Comisiones */}
                        {selectedWorkOrder.assignedMechanics && selectedWorkOrder.assignedMechanics.length > 0 ? (
                          <div className="space-y-2 pt-2 border-t border-red-200">
                            <div className="flex items-center gap-2 py-1">
                              <Users className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-600">Mecánicos Comisionados:</span>
                            </div>
                            {selectedWorkOrder.assignedMechanics.map((mechanic, index) => (
                              <div key={index} className="flex justify-between items-center py-1 px-2 bg-red-50 rounded">
                                <span className="text-sm text-red-700">
                                  {mechanic.nombre_mecanico} ({mechanic.porcentaje_comision}%)
                                </span>
                                <span className="text-sm font-semibold text-red-600">
                                  {formatCurrency(mechanic.monto_comision)}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center py-1 px-2 bg-red-100 rounded border border-red-200">
                              <span className="text-sm font-medium text-red-800">Total Comisiones:</span>
                              <span className="text-sm font-bold text-red-800">
                                {formatCurrency(selectedWorkOrder.assignedMechanics.reduce((total, mechanic) => total + mechanic.monto_comision, 0))}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-2 py-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">No hay mecánicos asignados a este trabajo</span>
                            </div>
                          </div>
                        )}

                        {/* Cobro al Cliente (Mano de Obra + Precios Cliente) */}
                        <div className="flex justify-between py-1">
                          <span className="text-sm font-medium">Cobro al Cliente:</span>
                          <span className="font-semibold text-lg text-purple-600">
                            {(() => {
                              // Calcular total de precios cliente
                              const totalPreciosCliente = selectedWorkOrder.expenseDetails.reduce((total, expense) => {
                                const precioCliente = Number(expense.amountCharged) || Number(expense.amount) || 0;
                                return total + precioCliente;
                              }, 0);
                              
                              // Cobro al Cliente = Mano de Obra + Precios Cliente
                              // Ejemplo: 80000 (mano de obra) + 70000 (precios cliente) = 150000
                              const manoObra = selectedWorkOrder.manoObra || 0;
                              return formatCurrency(manoObra + totalPreciosCliente);
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Mensaje cuando no hay gastos detallados */}
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        <Coins className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No hay gastos detallados disponibles</p>
                        <p className="text-xs">Los gastos se mostrarán aquí cuando estén disponibles</p>
                        <p className="text-xs text-red-500">Debug: expenseDetails = {JSON.stringify(selectedWorkOrder?.expenseDetails)}</p>
                        <p className="text-xs text-red-500">Debug: length = {selectedWorkOrder?.expenseDetails?.length}</p>
                        <p className="text-xs text-red-500">Debug: selectedWorkOrder ID = {selectedWorkOrder?.id}</p>
                      </div>

                      {/* Totales básicos cuando no hay gastos detallados */}
                      <div className="space-y-2 pt-3 border-t">
                        {/* Total de gastos (solo el monto total) */}
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm font-medium">Total de Gastos:</span>
                          <span className="text-red-600">{formatCurrency(selectedWorkOrder.expenses)}</span>
                        </div>

                        {/* Costo total y ganancia */}
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between py-1">
                            <span className="text-sm font-medium">Costo Total Cobrado:</span>
                            <span className="font-semibold text-lg text-green-600">
                              {formatCurrency(selectedWorkOrder.totalCost)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-sm font-medium">Cobro al Cliente:</span>
                            <span className="font-semibold text-lg text-purple-600">
                              {formatCurrency(selectedWorkOrder.totalCost)}
                            </span>
                          </div>
                          {(() => {
                            const manoObra = selectedWorkOrder.manoObra || 0;
                            const gananciaBase = manoObra - selectedWorkOrder.expenses;
                            const markupRepuestos = selectedWorkOrder.markupRepuestos || 0;
                            
                            return (
                              <>
                                <div className="flex justify-between py-1">
                                  <span className="text-sm font-medium">Ganancia Base:</span>
                                  <span className="font-semibold text-lg text-blue-600">
                                    {formatCurrency(gananciaBase)}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-sm font-medium">Ganancia Neta:</span>
                                  <span className="font-semibold text-lg text-green-600">
                                    {formatCurrency(gananciaBase + markupRepuestos)}
                                  </span>
                                </div>
                              </>
                            );
                          })()}

                          {/* Mecánicos Asignados y Comisiones */}
                          {selectedWorkOrder.assignedMechanics && selectedWorkOrder.assignedMechanics.length > 0 ? (
                            <div className="space-y-2 pt-2 border-t border-red-200">
                              <div className="flex items-center gap-2 py-1">
                                <Users className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">Mecánicos Comisionados:</span>
                              </div>
                              {selectedWorkOrder.assignedMechanics.map((mechanic, index) => (
                                <div key={index} className="flex justify-between items-center py-1 px-2 bg-red-50 rounded">
                                  <span className="text-sm text-red-700">
                                    {mechanic.nombre_mecanico} ({mechanic.porcentaje_comision}%)
                                  </span>
                                  <span className="text-sm font-semibold text-red-600">
                                    {formatCurrency(mechanic.monto_comision)}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center py-1 px-2 bg-red-100 rounded border border-red-200">
                                <span className="text-sm font-medium text-red-800">Total Comisiones:</span>
                                <span className="text-sm font-bold text-red-800">
                                  {formatCurrency(selectedWorkOrder.assignedMechanics.reduce((total, mechanic) => total + mechanic.monto_comision, 0))}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-2 py-1">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">No hay mecánicos asignados a este trabajo</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>


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

      {/* Print Options Modal */}
      <Dialog open={isPrintOptionsModalOpen} onOpenChange={setIsPrintOptionsModalOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-blue-600">
              <Printer className="h-5 w-5" />
              Opciones de Impresión
            </DialogTitle>
          </DialogHeader>

          {selectedOrderForPrint && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona una opción para la orden de trabajo <strong>{selectedOrderForPrint.id}</strong>
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handlePrintInvoice}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  variant="default"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Factura
                </Button>

                <Button
                  onClick={handleGeneratePDF}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  variant="default"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generar PDF
                </Button>

                <Button
                  onClick={handleGenerateElectronicInvoice}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  variant="default"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Generar Factura Electrónica
                </Button>
              </div>

            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPrintOptionsModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
