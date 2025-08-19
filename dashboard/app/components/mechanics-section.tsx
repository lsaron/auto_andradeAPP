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

export function MechanicsSection() {
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
  const [newMechanic, setNewMechanic] = useState<MechanicCreate & { id_number?: string }>({
    name: "",
    id_number: "",
  })
  const [editMechanic, setEditMechanic] = useState<MechanicCreate>({
    name: "",
  })
  type MechanicJob = {
    fecha: string
    matricula_carro: string
    descripcion: string
    costo: number
    ganancia_base?: number
    comision?: number
  }
  
  const [mechanicJobs, setMechanicJobs] = useState<MechanicJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableMonths] = useState([
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
    { value: "12", label: "Diciembre" }
  ])

  // Cargar mecánicos desde la API
  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await mecanicosApi.getAll()
        
        // Para cada mecánico, obtener sus estadísticas y mapear a la interfaz Mechanic
        const mecanicosConStats = await Promise.all(
          data.map(async (mecanico) => {
            try {
              const stats = await mecanicosApi.getStats(mecanico.id)
              return {
                id: mecanico.id.toString(),
                name: mecanico.nombre,
                mechanic_id: `MC-${mecanico.id}`, // Formato MC-1, MC-2, etc.
                jobs_completed: stats.trabajos_completados || 0,
                total_commission: parseFloat(stats.total_comisiones || 0),
                total_profit: parseFloat(stats.total_ganancias || 0),
                hire_date: mecanico.fecha_contratacion || new Date().toISOString(),
                created_at: mecanico.created_at || new Date().toISOString(),
                updated_at: mecanico.updated_at || new Date().toISOString()
              }
            } catch (err) {
              // Si no se pueden obtener estadísticas, usar valores por defecto
              return {
                id: mecanico.id.toString(),
                name: mecanico.nombre,
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
        
        setMechanics(mecanicosConStats)
      } catch (err) {
        setError("Error al cargar los mecánicos.")
        console.error(err)
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
      const data = await mecanicosApi.getAll()
      
      // Para cada mecánico, obtener sus estadísticas y mapear a la interfaz Mechanic
      const mecanicosConStats = await Promise.all(
        data.map(async (mecanico) => {
          try {
            const stats = await mecanicosApi.getStats(mecanico.id)
            return {
              id: mecanico.id.toString(),
              name: mecanico.nombre,
              mechanic_id: `MC-${mecanico.id}`, // Formato MC-1, MC-2, etc.
              jobs_completed: stats.trabajos_completados || 0,
              total_commission: parseFloat(stats.total_comisiones || 0),
              total_profit: parseFloat(stats.total_ganancias || 0),
              hire_date: mecanico.fecha_contratacion || new Date().toISOString(),
              created_at: mecanico.created_at || new Date().toISOString(),
              updated_at: mecanico.updated_at || new Date().toISOString()
            }
          } catch (err) {
            // Si no se pueden obtener estadísticas, usar valores por defecto
            return {
              id: mecanico.id.toString(),
              name: mecanico.nombre,
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
      
      setMechanics(mecanicosConStats)
    } catch (err) {
      setError("Error al recargar los mecánicos.")
      console.error(err)
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

    return {
      totalMechanics,
      totalJobs,
      totalCommissions,
    }
  }, [mechanics])

  const handleCreateMechanic = useCallback(async () => {
    if (!newMechanic.name.trim() || !newMechanic.id_number?.trim()) return

    try {
      const mechanicData = {
        nombre: newMechanic.name.trim(),
        id_nacional: newMechanic.id_number.trim(),
      }
      
      const mecanicoCreado = await mecanicosApi.create(mechanicData)
      
      // Mapear el mecánico creado a la interfaz Mechanic
      const nuevoMechanic: Mechanic = {
        id: mecanicoCreado.id.toString(),
        name: mecanicoCreado.nombre,
        mechanic_id: `MC-${mecanicoCreado.id}`, // Formato MC-1, MC-2, etc.
        jobs_completed: 0,
        total_commission: 0,
        total_profit: 0,
        hire_date: mecanicoCreado.fecha_contratacion || new Date().toISOString(),
        created_at: mecanicoCreado.created_at || new Date().toISOString(),
        updated_at: mecanicoCreado.updated_at || new Date().toISOString()
      }
      
      setMechanics((prev) => [...prev, nuevoMechanic])
      setNewMechanic({ name: "", id_number: "" })
      setIsCreateDialogOpen(false)
    } catch (err) {
      setError("Error al crear el mecánico.")
      console.error(err)
    }
  }, [newMechanic])

  const handleEditMechanic = useCallback(async () => {
    if (!selectedMechanic || !editMechanic.name.trim()) return

    try {
      const updatedMechanic = await mecanicosApi.update(parseInt(selectedMechanic.id), {
        nombre: editMechanic.name.trim()
      })
      
      // Mapear el mecánico actualizado a la interfaz Mechanic
      const mecanicoActualizado: Mechanic = {
        ...selectedMechanic,
        name: updatedMechanic.nombre,
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
      name: mechanic.name,
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
      console.log(`🔍 Obteniendo trabajos para mecánico ${mechanic.id} (${mechanic.name})`)
      const response = await fetch(`http://localhost:8000/mecanicos/${mechanic.id}/trabajos`)
      console.log(`🔍 Response status: ${response.status}`)
      
      if (response.ok) {
        const jobsData = await response.json()
        console.log(`🔍 Trabajos obtenidos:`, jobsData)
        setMechanicJobs(jobsData)
        
        if (jobsData.length > 0) {
          console.log(`🔍 Procesando ${jobsData.length} trabajos`)
          
          // Extraer años únicos de los trabajos para el filtro
          const years = [...new Set(jobsData.map((job: any) => 
            new Date(job.fecha as string).getFullYear().toString()
          ))].sort((a, b) => parseInt(b) - parseInt(a)) as string[]
          console.log(`🔍 Años disponibles:`, years)
          setAvailableYears(years)
          
          // Establecer el año más reciente por defecto
          if (years.length > 0) {
            const mostRecentYear = years[0]
            console.log(`🔍 Año más reciente:`, mostRecentYear)
            setSelectedYear(mostRecentYear)
            
            // Extraer meses disponibles para el año seleccionado
            const monthsForYear = [...new Set(jobsData
              .filter((job: any) => new Date(job.fecha as string).getFullYear().toString() === mostRecentYear)
              .map((job: any) => (new Date(job.fecha as string).getMonth() + 1).toString().padStart(2, '0'))
            )].sort((a, b) => parseInt(a) - parseInt(b)) as string[]
            console.log(`🔍 Meses disponibles para ${mostRecentYear}:`, monthsForYear)
            
            // Establecer el mes más reciente del año seleccionado por defecto
            if (monthsForYear.length > 0) {
              const mostRecentMonth = monthsForYear[monthsForYear.length - 1]
              console.log(`🔍 Mes más reciente:`, mostRecentMonth)
              setSelectedMonth(mostRecentMonth)
            } else {
              console.log(`🔍 No hay meses disponibles`)
              setSelectedMonth("")
            }
          } else {
            console.log(`🔍 No hay años disponibles`)
            setSelectedYear("")
            setSelectedMonth("")
          }
        } else {
          console.log(`🔍 No hay trabajos disponibles`)
          // Si no hay trabajos, limpiar filtros
          setAvailableYears([])
          setSelectedYear("")
          setSelectedMonth("")
        }
      } else {
        const errorText = await response.text()
        console.error(`❌ Error al obtener trabajos del mecánico: ${response.status} - ${errorText}`)
        setMechanicJobs([])
        setAvailableYears([])
        setSelectedYear("")
        setSelectedMonth("")
      }
    } catch (error) {
      console.error("Error al obtener trabajos del mecánico:", error)
      setMechanicJobs([])
      setAvailableYears([])
      setSelectedYear("")
      setSelectedMonth("")
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
    
    const filtered = mechanicJobs.filter((job) => {
      try {
        const jobDate = new Date(job.fecha as string)
        const jobYear = jobDate.getFullYear().toString()
        const jobMonth = (jobDate.getMonth() + 1).toString().padStart(2, '0')
        
        // Si solo hay año seleccionado, filtrar por año
        if (selectedYear && !selectedMonth) {
          const matches = jobYear === selectedYear
          console.log(`🔍 Trabajo ${job.matricula_carro} - Año: ${jobYear}, Filtro: ${selectedYear}, Coincide: ${matches}`)
          return matches
        }
        
        // Si solo hay mes seleccionado, filtrar por mes del año actual
        if (!selectedYear && selectedMonth) {
          const currentYear = new Date().getFullYear().toString()
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
        
        // Si no hay filtros, mostrar todos
        console.log(`🔍 Trabajo ${job.matricula_carro} - Sin filtros, mostrando`)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mecánicos</h1>
          <p className="text-muted-foreground">Gestiona la información de los mecánicos del taller</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reloadMechanics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
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
                    value={newMechanic.id_number || ""}
                    onChange={(e) => setNewMechanic((prev) => ({ ...prev, id_number: e.target.value }))}
                    placeholder="Ingresa el número de identificación"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Mecánico</Label>
                  <Input
                    id="name"
                    value={newMechanic.name}
                    onChange={(e) => setNewMechanic((prev) => ({ ...prev, name: e.target.value }))}
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mecánicos</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMechanics}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trabajos Completados</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡{stats.totalCommissions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar mecánicos por nombre o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {searchTerm && (
          <Badge variant="secondary">
            {filteredMechanics.length} resultado{filteredMechanics.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Mechanics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Mecánicos</CardTitle>
          <CardDescription>Información detallada de todos los mecánicos registrados</CardDescription>
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
                  <TableHead>Comisiones</TableHead>
                  <TableHead>Fecha de Contratación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMechanics.map((mechanic) => (
                  <TableRow key={mechanic.id}>
                    <TableCell>
                      <Badge variant="outline">{mechanic.mechanic_id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{mechanic.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{mechanic.jobs_completed || 0}</Badge>
                    </TableCell>
                    <TableCell>₡{(mechanic.total_commission || 0).toLocaleString()}</TableCell>
                    <TableCell>{mechanic.hire_date ? new Date(mechanic.hire_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openViewDialog(mechanic)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditDialog(mechanic)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          onClick={() => openJobsDialog(mechanic)}
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
                  <p className="text-sm font-medium text-gray-600">Comisiones Generadas</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">
                      ₡{selectedMechanic.total_commission.toLocaleString()}
                    </span>
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
                value={editMechanic.name}
                onChange={(e) => setEditMechanic((prev) => ({ ...prev, name: e.target.value }))}
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
            </DialogDescription>
          </DialogHeader>
          
          {selectedMechanic && (
            <div className="space-y-6">
              {/* Información del mecánico */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                   </h3>
                   
                   <div className="flex flex-col sm:flex-row gap-3">
                     {/* Filtro de año */}
                     <div className="flex flex-col gap-1">
                       <Label htmlFor="year-filter" className="text-sm font-medium text-gray-700">
                         Año
                       </Label>
                       <select
                         id="year-filter"
                         value={selectedYear}
                         onChange={(e) => setSelectedYear(e.target.value)}
                         className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       >
                         <option value="">Todos los años</option>
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
                         onChange={(e) => setSelectedMonth(e.target.value)}
                         className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       >
                         <option value="">Todos los meses</option>
                         {availableMonths.map((month) => (
                           <option key={month.value} value={month.value}>
                             {month.label}
                           </option>
                         ))}
                                                </select>
                       </div>
                       
                       {/* Botón para limpiar filtros */}
                       <div className="flex items-end">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             setSelectedYear("")
                             setSelectedMonth("")
                           }}
                           className="px-3 py-2 h-[42px]"
                         >
                           Limpiar Filtros
                         </Button>
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
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Monto Total</TableHead>
                          <TableHead className="text-right">Ganancia Base</TableHead>
                          <TableHead className="text-right">Comisión</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                                                 {filteredJobs.map((job, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(job.fecha).toLocaleDateString('es-CR')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{job.matricula_carro}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {job.descripcion}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₡{Number(job.costo).toLocaleString('es-CR')}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              ₡{Number(job.ganancia_base || 0).toLocaleString('es-CR')}
                            </TableCell>
                            <TableCell className="text-right font-medium text-blue-600">
                              ₡{Number(job.comision || 0).toLocaleString('es-CR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                                 ) : (
                   <div className="text-center py-8 text-muted-foreground">
                     <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                     <p className="text-lg">
                       {mechanicJobs.length === 0 
                         ? "No hay trabajos registrados para este mecánico"
                         : `No hay trabajos en ${availableMonths.find(m => m.value === selectedMonth)?.label || 'este mes'} de ${selectedYear}`
                       }
                     </p>
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
