"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Plus, Search, Eye, Edit, Trash2, UserCog, Wrench, DollarSign, Calendar, TrendingUp, RefreshCw } from "lucide-react"
import type { Mechanic, MechanicCreate } from "@/lib/types"
import { mecanicosApi } from "@/lib/api-client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useBiweeklyReset } from "@/hooks/use-biweekly-reset"

export function MechanicsSection() {
  // Hook para reset quincenal automático
  const {
    currentQuincena,
    currentMonth,
    currentYear,
    isMondayStartOfQuincena,
    isSundayEndOfQuincena,
    shouldShowResetBanner,
    executeReset
  } = useBiweeklyReset({
    autoReset: true,
    preserveHistory: true
  })

  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isJobsDialogOpen, setIsJobsDialogOpen] = useState(false)
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
  const [newMechanic, setNewMechanic] = useState<MechanicCreate>({
    nombre: "",
    id_nacional: "",
  })
  const [editMechanic, setEditMechanic] = useState<MechanicCreate>({
    nombre: "",
    id_nacional: "",
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)


  type MechanicJob = {
    id: number
    fecha: string
    matricula_carro: string
    descripcion: string
    costo: number
    mano_obra?: number
    total_gastos?: number
    ganancia_base?: number
    comision?: number
    porcentaje_comision?: number
    total_mecanicos_trabajo?: number
    comision_total_trabajo?: number
    estado_comision?: string
    gastos_detallados?: any[]
  }
  
  const [mechanicJobs, setMechanicJobs] = useState<MechanicJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [isCurrentPeriod, setIsCurrentPeriod] = useState(true)
  const [availableMonths] = useState([
    { value: 0, label: "Enero" },
    { value: 1, label: "Febrero" },
    { value: 2, label: "Marzo" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Mayo" },
    { value: 5, label: "Junio" },
    { value: 6, label: "Julio" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Septiembre" },
    { value: 9, label: "Octubre" },
    { value: 10, label: "Noviembre" },
    { value: 11, label: "Diciembre" }
  ])

  // Función para obtener años disponibles
  const obtenerAnosDisponibles = useCallback(() => {
    const anoActual = new Date().getFullYear()
    const anos = []
    for (let i = anoActual - 2; i <= anoActual + 1; i++) {
      anos.push(i)
    }
    setAvailableYears(anos)
  }, [])

  // Función para verificar si es período actual
  const verificarPeriodoActual = useCallback(() => {
    const fechaActual = new Date()
    const anoActual = fechaActual.getFullYear()
    const mesActual = fechaActual.getMonth()
    
    const esPeriodoActual = selectedYear === anoActual && selectedMonth === mesActual
    setIsCurrentPeriod(esPeriodoActual)
    
    console.log("📅 Verificando período actual:", {
      selectedYear,
      selectedMonth,
      anoActual,
      mesActual,
      esPeriodoActual
    })
  }, [selectedYear, selectedMonth])

  // Función para resetear al período actual
  const resetearAPeriodoActual = useCallback(() => {
    const fechaActual = new Date()
    setSelectedYear(fechaActual.getFullYear())
    setSelectedMonth(fechaActual.getMonth())
    setIsCurrentPeriod(true)
  }, [])

  // Cargar mecánicos desde la API
  useEffect(() => {
    obtenerAnosDisponibles()
  }, [obtenerAnosDisponibles])

  useEffect(() => {
    verificarPeriodoActual()
  }, [verificarPeriodoActual])

  // Manejar reset mensual automático
  useEffect(() => {
    const handleMonthlyReset = () => {
      console.log("🔄 Reset mensual automático ejecutado en mechanics-section")
      resetearAPeriodoActual()
      // Recargar datos para mostrar solo el período actual
      reloadMechanics()
    }

    window.addEventListener('monthlyReset', handleMonthlyReset)
    return () => window.removeEventListener('monthlyReset', handleMonthlyReset)
  }, [resetearAPeriodoActual])

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("🔍 Cargando mecánicos desde la API...")
        const data = await mecanicosApi.getAll()
        console.log("🔍 Datos de mecánicos obtenidos:", data)
        
        // Para cada mecánico, obtener sus estadísticas y mapear a la interfaz Mechanic
        const mecanicosConStats = await Promise.all(
          data.map(async (mecanico: any) => {
            try {
              console.log(`🔍 Obteniendo estadísticas para mecánico ${mecanico.id}...`)
              const stats: any = await mecanicosApi.getStats(parseInt(mecanico.id))
              console.log(`🔍 Estadísticas para mecánico ${mecanico.id}:`, stats)
              console.log(`🔍 Tipo de stats:`, typeof stats, stats === null, stats === undefined)
              
              const mecanicoMapeado = {
                id: mecanico.id.toString(),
                name: mecanico.nombre || '',
                mechanic_id: `MC-${mecanico.id}`, // Formato MC-1, MC-2, etc.
                jobs_completed: stats?.total_trabajos || 0,
                total_commission: parseFloat(stats?.comisiones_mes?.toString() || '0'),
                total_profit: parseFloat(stats?.total_ganancias?.toString() || '0'),
                hire_date: mecanico.fecha_contratacion || new Date().toISOString(),
                created_at: mecanico.created_at || new Date().toISOString(),
                updated_at: mecanico.updated_at || new Date().toISOString()
              }
              
              console.log(`🔍 Mecánico ${mecanico.id} mapeado:`, mecanicoMapeado)
              return mecanicoMapeado
            } catch (err) {
              console.error(`❌ Error al obtener estadísticas para mecánico ${mecanico.id}:`, err)
              // Si no se pueden obtener estadísticas, usar valores por defecto
              return {
                id: mecanico.id.toString(),
                name: mecanico.nombre || '',
                mechanic_id: `MC-${mecanico.id}`, // Formato MC-1, MC-2, etc.
                jobs_completed: 0,
                total_commission: 0,
                total_profit: 0,
                hire_date: mecanico.fecha_contratacion || new Date().toISOString(),
                created_at: mecanico.created_at || new Date().toISOString(),
                updated_at: mecanico.updated_at || new Date().toISOString()
              }
            }
          })
        )
        
        console.log("🔍 Todos los mecánicos con estadísticas:", mecanicosConStats)
        setMechanics(mecanicosConStats)
        setLastUpdated(new Date())
      } catch (err) {
        console.error("❌ Error al cargar mecánicos:", err)
        setError("Error al cargar los mecánicos.")
      } finally {
        setLoading(false)
      }
    }

    fetchMechanics()
  }, [])

  // Función para recargar mecánicos
  const reloadMechanics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Recargando mecánicos...")
      const data = await mecanicosApi.getAll()
      console.log("🔄 Datos de mecánicos obtenidos:", data)
      
      // Para cada mecánico, obtener sus estadísticas y mapear a la interfaz Mechanic
      const mecanicosConStats = await Promise.all(
        data.map(async (mecanico: any) => {
          try {
            console.log(`🔄 Obteniendo estadísticas para mecánico ${mecanico.id}...`)
            const stats: any = await mecanicosApi.getStats(parseInt(mecanico.id))
            console.log(`🔄 Estadísticas para mecánico ${mecanico.id}:`, stats)
            
            const mecanicoMapeado = {
              id: mecanico.id.toString(),
              name: mecanico.nombre || '',
              mechanic_id: `MC-${mecanico.id}`, // Formato MC-1, MC-2, etc.
              jobs_completed: stats?.total_trabajos || 0,
              total_commission: parseFloat(stats?.comisiones_mes?.toString() || '0'),
              total_profit: parseFloat(stats?.total_ganancias?.toString() || '0'),
              hire_date: mecanico.fecha_contratacion || new Date().toISOString(),
              created_at: mecanico.created_at || new Date().toISOString(),
              updated_at: mecanico.updated_at || new Date().toISOString()
            }
            
            console.log(`🔄 Mecánico ${mecanico.id} mapeado:`, mecanicoMapeado)
            return mecanicoMapeado
          } catch (err) {
            console.error(`❌ Error al obtener estadísticas para mecánico ${mecanico.id}:`, err)
            // Si no se pueden obtener estadísticas, usar valores por defecto
            return {
              id: mecanico.id.toString(),
              name: mecanico.nombre || '',
              mechanic_id: `MC-${mecanico.id}`, // Formato MC-1, MC-2, etc.
              jobs_completed: 0,
              total_commission: 0,
              total_profit: 0,
              hire_date: mecanico.fecha_contratacion || new Date().toISOString(),
              created_at: mecanico.created_at || new Date().toISOString(),
              updated_at: mecanico.updated_at || new Date().toISOString()
            }
          }
        })
      )
      
      console.log("🔄 Todos los mecánicos con estadísticas:", mecanicosConStats)
      setMechanics(mecanicosConStats)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("❌ Error al recargar mecánicos:", err)
      setError("Error al recargar los mecánicos.")
    } finally {
      setLoading(false)
    }
  }, [])



  // Filter mechanics based on search term
  const filteredMechanics = useMemo(() => {
    if (!searchTerm) return mechanics

    return mechanics.filter(
      (mechanic) =>
        mechanic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mechanic.mechanic_id.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [mechanics, searchTerm])

  // Statistics
  const stats = useMemo(() => {
    const totalMechanics = mechanics.length
    const totalJobs = mechanics.reduce((sum, mechanic) => sum + mechanic.jobs_completed, 0)
    const totalCommissions = mechanics.reduce((sum, mechanic) => sum + mechanic.total_commission, 0)

    console.log("📊 Calculando estadísticas:", {
      totalMechanics,
      totalJobs,
      totalCommissions,
      mechanics: mechanics.map(m => ({
        id: m.id,
        name: m.name,
        jobs_completed: m.jobs_completed,
        total_commission: m.total_commission
      }))
    })

    return {
      totalMechanics,
      totalJobs,
      totalCommissions,
    }
  }, [mechanics])

  const handleCreateMechanic = useCallback(async () => {
    if (!newMechanic.nombre.trim() || !newMechanic.id_nacional?.trim()) return

    try {
      const mechanicData = {
        nombre: newMechanic.nombre.trim(),
        id_nacional: newMechanic.id_nacional.trim(),
      }
      
      const mecanicoCreado: any = await mecanicosApi.create(mechanicData)
      
      // Mapear el mecánico creado a la interfaz Mechanic
      const nuevoMechanic: Mechanic = {
        id: mecanicoCreado.id.toString(),
        name: mecanicoCreado.nombre || '',
        mechanic_id: `MC-${mecanicoCreado.id}`, // Formato MC-1, MC-2, etc.
        jobs_completed: 0,
        total_commission: 0,
        total_profit: 0,
        hire_date: mecanicoCreado.fecha_contratacion || new Date().toISOString(),
        created_at: mecanicoCreado.created_at || new Date().toISOString(),
        updated_at: mecanicoCreado.updated_at || new Date().toISOString()
      }
      
      setMechanics((prev) => [...prev, nuevoMechanic])
      setNewMechanic({ nombre: "", id_nacional: "" })
      setIsCreateDialogOpen(false)
    } catch (err) {
      setError("Error al crear el mecánico.")
      console.error(err)
    }
  }, [newMechanic])

  const handleEditMechanic = useCallback(async () => {
    if (!selectedMechanic || !editMechanic.nombre.trim()) return

    try {
      const updatedMechanic: any = await mecanicosApi.update(parseInt(selectedMechanic.id), {
        nombre: editMechanic.nombre.trim()
      })
      
      // Mapear el mecánico actualizado a la interfaz Mechanic
      const mecanicoActualizado: Mechanic = {
        ...selectedMechanic,
        name: updatedMechanic.nombre || '',
        updated_at: updatedMechanic.updated_at || new Date().toISOString()
      }
      
      setMechanics((prev) =>
        prev.map((mechanic) =>
          mechanic.id === selectedMechanic.id
            ? mecanicoActualizado
            : mechanic,
        ),
      )
      setIsEditDialogOpen(false)
      setSelectedMechanic(null)
    } catch (err) {
      setError("Error al editar el mecánico.")
      console.error(err)
    }
  }, [selectedMechanic, editMechanic])

  const handleDeleteMechanic = useCallback(async () => {
    if (!selectedMechanic) return

    try {
      await mecanicosApi.delete(parseInt(selectedMechanic.id))
      setMechanics((prev) => prev.filter((mechanic) => mechanic.id !== selectedMechanic.id))
      setIsDeleteDialogOpen(false)
      setSelectedMechanic(null)
    } catch (err) {
      setError("Error al eliminar el mecánico.")
      console.error(err)
    }
  }, [selectedMechanic])

  const openViewDialog = useCallback((mechanic: Mechanic) => {
    setSelectedMechanic(mechanic)
    setIsViewDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((mechanic: Mechanic) => {
    setSelectedMechanic(mechanic)
    setEditMechanic({
      nombre: mechanic.name,
      id_nacional: "",
    })
    setIsEditDialogOpen(true)
  }, [])

  const openDeleteDialog = useCallback((mechanic: Mechanic) => {
    setSelectedMechanic(mechanic)
    setIsDeleteDialogOpen(true)
  }, [])

  const openJobsDialog = useCallback(async (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic)
    setIsJobsDialogOpen(true)
    setLoadingJobs(true)
    
    try {
      // Obtener los trabajos del mecánico desde la API
      const url = `http://localhost:8000/api/mecanicos/${mechanic.id}/trabajos`
      console.log(`🔍 Obteniendo trabajos para mecánico ${mechanic.id} (${mechanic.name})`)
      console.log(`🔍 URL de la API: ${url}`)
      const response = await fetch(url)
      console.log(`🔍 Response status: ${response.status}`)
      console.log(`🔍 Response headers:`, response.headers)
      
      if (response.ok) {
        const jobsData = await response.json()
        console.log(`🔍 Trabajos obtenidos:`, jobsData)
        console.log(`🔍 Tipo de datos:`, typeof jobsData)
        console.log(`🔍 Es array:`, Array.isArray(jobsData))
        console.log(`🔍 Longitud:`, jobsData?.length || 0)
        
        // ✅ El backend ya calcula correctamente las comisiones
        // Solo necesitamos procesar los datos para mostrar la información
        const jobsWithDetails = jobsData.map((job: any) => {
          console.log(`🔍 Procesando trabajo ${job.id}:`, {
            id: job.id,
            fecha: job.fecha,
            matricula: job.matricula_carro,
            descripcion: job.descripcion,
            costo: job.costo,
            mano_obra: job.mano_obra,
            total_gastos: job.total_gastos,
            ganancia_base: job.ganancia_base,
            comision: job.comision
          })
          
          return {
            ...job,
            // Los campos ya vienen calculados correctamente del backend
            ganancia_base: job.ganancia_base || 0,
            comision: job.comision || 0
          }
        })
        
        setMechanicJobs(jobsWithDetails)
        
        if (jobsWithDetails.length > 0) {
          console.log(`🔍 Procesando ${jobsWithDetails.length} trabajos con detalles`)
          
          // Extraer años únicos de los trabajos para el filtro
          const yearsSet = new Set<number>(jobsWithDetails.map((job: any) => 
            new Date(job.fecha as string).getFullYear()
          ))
          const years = Array.from(yearsSet).sort((a: number, b: number) => b - a)
          console.log(`🔍 Años disponibles:`, years)
          setAvailableYears(years)
          
          // Por defecto, mostrar todos los trabajos (sin filtros)
          console.log(`🔍 Estableciendo filtros por defecto: mostrar todos los trabajos`)
          setSelectedYear(new Date().getFullYear())
          setSelectedMonth(new Date().getMonth())
        } else {
          console.log(`🔍 No hay trabajos disponibles`)
          // Si no hay trabajos, limpiar filtros
          setAvailableYears([])
          setSelectedYear(new Date().getFullYear())
          setSelectedMonth(new Date().getMonth())
        }
      } else {
        const errorText = await response.text()
        console.error(`❌ Error al obtener trabajos del mecánico: ${response.status} - ${errorText}`)
        setMechanicJobs([])
        setAvailableYears([])
        setSelectedYear(new Date().getFullYear())
        setSelectedMonth(new Date().getMonth())
      }
    } catch (error) {
      console.error("Error al obtener trabajos del mecánico:", error)
      setMechanicJobs([])
      setAvailableYears([])
      setSelectedYear(new Date().getFullYear())
      setSelectedMonth(new Date().getMonth())
    } finally {
      setLoadingJobs(false)
    }
  }, [])

  // Filtrar trabajos por año y mes seleccionados
  const filteredJobs = useMemo(() => {
    console.log(`🔍 Filtrando trabajos:`, {
      totalJobs: mechanicJobs.length,
      selectedYear,
      selectedMonth,
      availableYears
    })
    
    // Si no hay filtros seleccionados, mostrar todos los trabajos
    if (selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth()) {
      console.log(`🔍 Período actual: mostrando todos los ${mechanicJobs.length} trabajos`)
      return mechanicJobs
    }
    
    const filtered = mechanicJobs.filter((job) => {
      try {
        const jobDate = new Date(job.fecha as string)
        const jobYear = jobDate.getFullYear()
        const jobMonth = jobDate.getMonth()
        
        // Si solo hay año seleccionado, filtrar por año
        if (selectedYear !== new Date().getFullYear() && selectedMonth === new Date().getMonth()) {
          const matches = jobYear === selectedYear
          console.log(`🔍 Trabajo ${job.matricula_carro} - Año: ${jobYear}, Filtro: ${selectedYear}, Coincide: ${matches}`)
          return matches
        }
        
        // Si solo hay mes seleccionado, filtrar por mes del año actual
        if (selectedYear === new Date().getFullYear() && selectedMonth !== new Date().getMonth()) {
          const currentYear = new Date().getFullYear()
          const matches = jobYear === currentYear && jobMonth === selectedMonth
          console.log(`🔍 Trabajo ${job.matricula_carro} - Año: ${jobYear}, Mes: ${jobMonth}, Filtro: ${selectedMonth}, Coincide: ${matches}`)
          return matches
        }
        
        // Si hay ambos, filtrar por año y mes
        if (selectedYear && selectedMonth) {
          const matches = jobYear === selectedYear && jobMonth === selectedMonth
          console.log(`🔍 Trabajo ${job.matricula_carro} - Año: ${jobYear}, Mes: ${jobMonth}, Filtros: ${selectedYear}/${selectedMonth}, Coincide: ${matches}`)
          return matches
        }
        
        return true
      } catch (error) {
        console.error("Error al procesar fecha del trabajo:", error)
        return false
      }
    })
    
    console.log(`🔍 Trabajos filtrados: ${filtered.length} de ${mechanicJobs.length}`)
    return filtered
  }, [mechanicJobs, selectedYear, selectedMonth, availableYears])



  if (loading && mechanics.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg">Cargando mecánicos...</span>
      </div>
    )
  }

  if (error && mechanics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ErrorMessage error={new Error(error)} onRetry={reloadMechanics} />
        <Button onClick={reloadMechanics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="space-y-8 p-6">
        {/* Header con gradiente y sombras */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                    <UserCog className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Mecánicos
                    </h1>
                    <p className="text-blue-100 text-lg font-medium">Gestiona la información de los mecánicos del taller</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={reloadMechanics} 
                  disabled={loading}
                  className="min-w-[140px] bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Actualizando...' : 'Actualizar'}
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold">
                      <Plus className="h-4 w-4" />
                      Nuevo Mecánico
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Mecánico</DialogTitle>
                <DialogDescription>Ingresa la información del nuevo mecánico</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="id_number">Número de Identificación</Label>
                  <Input
                    id="id_number"
                    value={newMechanic.id_nacional || ""}
                    onChange={(e) => setNewMechanic((prev) => ({ ...prev, id_nacional: e.target.value }))}
                    placeholder="Ingresa el número de identificación"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Mecánico</Label>
                  <Input
                    id="name"
                    value={newMechanic.nombre}
                    onChange={(e) => setNewMechanic((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ingresa el nombre completo"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateMechanic}>Crear Mecánico</Button>
              </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Banner de Reset Mensual */}
        {shouldShowResetBanner && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Reset Mensual Próximo</h3>
                <p className="text-sm text-amber-100">
                  Los datos se resetearán automáticamente el primer lunes del próximo mes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards con diseño moderno */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-100">Total Mecánicos</CardTitle>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                <UserCog className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-2">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-blue-100">Actualizando...</span>
                  </div>
                ) : (
                  stats.totalMechanics
                )}
              </div>
              <p className="text-blue-100 text-sm font-medium">Mecánicos registrados</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-emerald-100">Trabajos Completados</CardTitle>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                <Wrench className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-2">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-emerald-100">Actualizando...</span>
                  </div>
                ) : (
                  stats.totalJobs
                )}
              </div>
              <p className="text-emerald-100 text-sm font-medium">Trabajos realizados</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-purple-100">Comisiones Totales</CardTitle>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-2">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-purple-100">Actualizando...</span>
                  </div>
                ) : (
                  `₡${stats.totalCommissions.toLocaleString()}`
                )}
              </div>
              <p className="text-purple-100 text-sm font-medium">Comisiones pagadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Search con diseño mejorado */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Buscar mecánicos por nombre o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-base"
              />
            </div>
            {searchTerm && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2 text-sm font-medium">
                {filteredMechanics.length} resultado{filteredMechanics.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Mechanics Table con diseño mejorado */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-xl border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCog className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Lista de Mecánicos</CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    Información detallada de todos los mecánicos registrados
                    {!isCurrentPeriod && (
                      <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                        Datos Históricos
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              {!isCurrentPeriod && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetearAPeriodoActual}
                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ver Período Actual
                </Button>
              )}
            </div>
          </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Actualizando...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Mecánico</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Trabajos Completados</TableHead>
                  <TableHead>Ganancias Generadas</TableHead>
                                     <TableHead>Comisiones</TableHead>
                  <TableHead>Fecha de Contratación</TableHead>

                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMechanics.map((mechanic, index) => (
                  <TableRow key={mechanic.id} className="hover:bg-slate-50/50 transition-colors duration-200">
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                        {mechanic.mechanic_id}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">{mechanic.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold">
                        {mechanic.jobs_completed || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      ₡{(mechanic.total_profit || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-purple-600">
                      ₡{(mechanic.total_commission || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {mechanic.hire_date ? new Date(mechanic.hire_date).toLocaleDateString() : 'N/A'}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => openViewDialog(mechanic)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-emerald-100 hover:text-emerald-600 transition-colors duration-200"
                          onClick={() => openEditDialog(mechanic)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-indigo-100 hover:text-indigo-600 transition-colors duration-200"
                          onClick={() => openJobsDialog(mechanic)}
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                          onClick={() => openDeleteDialog(mechanic)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filteredMechanics.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No se encontraron mecánicos con esa búsqueda" : "No hay mecánicos registrados"}
            </div>
          )}
          </CardContent>
        </Card>
        </div>

        {/* View Mechanic Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Mecánico</DialogTitle>
          </DialogHeader>
          {selectedMechanic && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900">ID del Mecánico</p>
                <p className="text-lg font-mono text-blue-700">#{selectedMechanic.mechanic_id}</p>
              </div>

              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nombre</p>
                  <p className="text-lg">{selectedMechanic.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Trabajos Completados</p>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span className="text-lg font-semibold">{selectedMechanic.jobs_completed}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Ganancias Generadas</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-lg font-semibold text-emerald-600">
                      ₡{selectedMechanic.total_profit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Comisiones Generadas</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-green-600">
                      ₡{selectedMechanic.total_commission.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha de Contratación</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span>{new Date(selectedMechanic.hire_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mechanic Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Editar Mecánico</DialogTitle>
            <DialogDescription>Modifica la información del mecánico</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre del Mecánico</Label>
              <Input
                id="edit-name"
                value={editMechanic.nombre}
                onChange={(e) => setEditMechanic((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ingresa el nombre completo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditMechanic}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Mecánico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el mecánico:
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedMechanic && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="space-y-2">
                <p>
                  <strong>ID:</strong> {selectedMechanic.mechanic_id}
                </p>
                <p>
                  <strong>Nombre:</strong> {selectedMechanic.name}
                </p>
                <p>
                  <strong>Trabajos Completados:</strong> {selectedMechanic.jobs_completed}
                </p>
                <p>
                  <strong>Ganancias Generadas:</strong> ₡{selectedMechanic.total_profit.toLocaleString()}
                </p>
                <p>
                  <strong>Comisiones:</strong> ₡{selectedMechanic.total_commission.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMechanic} className="bg-red-600 hover:bg-red-700">
              Eliminar Mecánico
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Jobs Dialog */}
      <Dialog open={isJobsDialogOpen} onOpenChange={setIsJobsDialogOpen}>
        <DialogContent className="bg-white max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Trabajos del Mecánico</DialogTitle>
            <DialogDescription>
              Lista de todos los trabajos realizados por este mecánico
              {!isCurrentPeriod && (
                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                  Datos Históricos
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMechanic && (
            <div className="space-y-6">
              {/* Información del mecánico */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Nombre</p>
                    <p className="text-lg font-semibold text-blue-700">{selectedMechanic.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">ID del Mecánico</p>
                    <p className="text-lg font-mono text-blue-700">#{selectedMechanic.mechanic_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Trabajos Completados</p>
                    <p className="text-lg font-semibold text-blue-700">
                      {selectedMechanic.jobs_completed || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Fecha de Contratación</p>
                    <p className="text-lg font-semibold text-blue-700">
                      {selectedMechanic.created_at ? new Date(selectedMechanic.created_at).toLocaleDateString('es-CR') : 'N/A'}
                    </p>
                  </div>
                </div>
              
                {/* Segunda fila con información adicional */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total Mano de Obra</p>
                    <p className="text-lg font-semibold text-green-600">
                      ₡{filteredJobs.reduce((total, job) => total + (Number(job.mano_obra) || 0), 0).toLocaleString('es-CR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Costos Repuestos/Materiales</p>
                    <p className="text-lg font-semibold text-red-600">
                      ₡{filteredJobs.reduce((total, job) => total + (Number(job.total_gastos) || 0), 0).toLocaleString('es-CR')}
                    </p>
                  </div>
                                     <div>
                     <p className="text-sm font-medium text-blue-900">Comisiones Totales</p>
                     <p className="text-lg font-semibold text-purple-600">
                       ₡{filteredJobs.reduce((total, job) => total + (Number(job.comision) || 0), 0).toLocaleString('es-CR')}
                     </p>
                   </div>
                </div>
              </div>

                             {/* Lista de trabajos */}
               <div className="space-y-4">
                 {/* Filtros de año y mes */}
                 <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                   <h3 className="text-lg font-semibold text-gray-900">
                     Trabajos Realizados 
                     {filteredJobs.length !== mechanicJobs.length && (
                       <span className="text-sm font-normal text-gray-500 ml-2">
                         ({filteredJobs.length} de {mechanicJobs.length})
                       </span>
                     )}
                     {(selectedYear || selectedMonth) && (
                       <Badge variant="secondary" className="ml-2">
                         Filtros activos
                       </Badge>
                     )}
                   </h3>
                   
                   <div className="flex flex-col sm:flex-row gap-3">
                     {/* Botón para resetear al período actual */}
                     {!isCurrentPeriod && (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={resetearAPeriodoActual}
                         className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                       >
                         <RefreshCw className="h-4 w-4 mr-2" />
                         Período Actual
                       </Button>
                     )}
                     
                     {/* Filtro de año */}
                     <div className="flex flex-col gap-1">
                       <Label htmlFor="year-filter" className="text-sm font-medium text-gray-700">
                         Año
                       </Label>
                       <select
                         id="year-filter"
                         value={selectedYear}
                         onChange={(e) => setSelectedYear(Number(e.target.value))}
                         className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       >
                         <option value={new Date().getFullYear()}>Año actual</option>
                         {availableYears.map((year) => (
                           <option key={year} value={year}>
                             {year}
                           </option>
                         ))}
                       </select>
                     </div>
                     
                     {/* Filtro de mes */}
                     <div className="flex flex-col gap-1">
                       <Label htmlFor="month-filter" className="text-sm font-medium text-gray-700">
                         Mes
                       </Label>
                       <select
                         id="month-filter"
                         value={selectedMonth}
                         onChange={(e) => setSelectedMonth(Number(e.target.value))}
                         className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       >
                         <option value={new Date().getMonth()}>Mes actual</option>
                         {availableMonths.map((month) => (
                           <option key={month.value} value={month.value}>
                             {month.label}
                           </option>
                         ))}
                       </select>
                       </div>
                       
                                                                        {/* Botón para limpiar filtros */}
                        <div className="flex items-end gap-2">
                          {(selectedYear !== new Date().getFullYear() || selectedMonth !== new Date().getMonth()) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedYear(new Date().getFullYear())
                                setSelectedMonth(new Date().getMonth())
                              }}
                              className="px-3 py-2 h-[42px]"
                            >
                              Período Actual
                            </Button>
                          )}
                        </div>
                     </div>
                   </div>
                
                {loadingJobs ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                    <span className="ml-3 text-lg">Cargando trabajos...</span>
                  </div>
                                 ) : filteredJobs.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Vehículo / Orden</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Mano de Obra</TableHead>
                          <TableHead className="text-right">Costos</TableHead>
                                                     <TableHead className="text-right">Comisión Total</TableHead>
                           <TableHead className="text-right">Comisión Individual</TableHead>
                           <TableHead className="text-center">Estado Comisión</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredJobs.map((job, index) => {
                          // Debug: Log de los datos del trabajo
                          console.log(`🔍 Trabajo ${index}:`, {
                            id: job.id,
                            fecha: job.fecha,
                            matricula: job.matricula_carro,
                            descripcion: job.descripcion,
                            costo: job.costo,
                            mano_obra: job.mano_obra,
                            total_gastos: job.total_gastos,
                            ganancia_base: job.ganancia_base,
                            comision: job.comision,
                            total_mecanicos_trabajo: job.total_mecanicos_trabajo,
                            comision_total_trabajo: job.comision_total_trabajo
                          })
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {new Date(job.fecha).toLocaleDateString('es-CR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline">{job.matricula_carro}</Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    WO-{job.id.toString().padStart(3, '0')}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {job.descripcion}
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600">
                                ₡{Number(job.mano_obra || 0).toLocaleString('es-CR')}
                              </TableCell>
                              <TableCell className="text-right font-medium text-red-600">
                                ₡{Number(job.total_gastos || 0).toLocaleString('es-CR')}
                              </TableCell>
                               <TableCell className="text-right font-medium text-blue-600">
                                 ₡{Number(job.comision_total_trabajo || 0).toLocaleString('es-CR')}
                               </TableCell>
                              <TableCell className="text-right font-medium text-purple-600">
                                ₡{Number(job.comision || 0).toLocaleString('es-CR')}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant={
                                    job.estado_comision === 'APROBADA' ? 'default' :
                                    job.estado_comision === 'DENEGADA' ? 'destructive' :
                                    job.estado_comision === 'PENALIZADA' ? 'secondary' :
                                    'outline'
                                  }
                                  className={
                                    job.estado_comision === 'APROBADA' ? 'bg-green-100 text-green-800 border-green-200' :
                                    job.estado_comision === 'DENEGADA' ? 'bg-red-100 text-red-800 border-red-200' :
                                    job.estado_comision === 'PENALIZADA' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    'bg-gray-100 text-gray-800 border-gray-200'
                                  }
                                >
                                  {job.estado_comision || 'PENDIENTE'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                                 ) : (
                   <div className="text-center py-8 text-muted-foreground">
                     <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                     <p className="text-lg">
                       {mechanicJobs.length === 0 
                         ? "No hay trabajos registrados para este mecánico"
                         : selectedYear && selectedMonth
                           ? `No hay trabajos en ${availableMonths.find(m => m.value === selectedMonth)?.label || 'este mes'} de ${selectedYear}`
                           : selectedYear
                             ? `No hay trabajos en el año ${selectedYear}`
                             : selectedMonth
                               ? `No hay trabajos en ${availableMonths.find(m => m.value === selectedMonth)?.label || 'este mes'}`
                               : "No hay trabajos disponibles"
                       }
                     </p>
                     {mechanicJobs.length > 0 && (selectedYear || selectedMonth) && (
                       <p className="text-sm text-gray-500 mt-2">
                         Intenta ajustar los filtros o limpiarlos para ver todos los trabajos
                       </p>
                     )}
                   </div>
                 )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJobsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
