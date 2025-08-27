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
import { Plus, Search, Eye, Edit, Trash2, DollarSign, Calendar, TrendingUp, RefreshCw, Wrench, Users, Zap, Droplets } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"

// Interfaces para los tipos de datos
interface GastoTaller {
  id: string
  descripcion: string
  monto: number
  categoria: string
  fecha_gasto: string
  created_at: string
  updated_at: string
}

interface PagoSalario {
  id: string
  id_mecanico: string
  nombre_mecanico: string
  monto_salario: number
  semana_pago: string
  fecha_pago: string
  created_at: string
}

interface Mecanico {
  id: string
  nombre: string
}

interface GastoTallerCreate {
  descripcion: string
  monto: number
  categoria: string
  fecha_gasto: string
}

interface PagoSalarioCreate {
  id_mecanico: string
  monto_salario: number
  semana_pago: string
  fecha_pago: string
}

export function TallerSection() {
  // Estados para gastos del taller
  const [gastos, setGastos] = useState<GastoTaller[]>([])
  const [loadingGastos, setLoadingGastos] = useState(true)
  const [errorGastos, setErrorGastos] = useState<string | null>(null)
  const [searchTermGastos, setSearchTermGastos] = useState("")
  const [isCreateGastoDialogOpen, setIsCreateGastoDialogOpen] = useState(false)
  const [isViewGastoDialogOpen, setIsViewGastoDialogOpen] = useState(false)
  const [isEditGastoDialogOpen, setIsEditGastoDialogOpen] = useState(false)
  const [isDeleteGastoDialogOpen, setIsDeleteGastoDialogOpen] = useState(false)
  const [selectedGasto, setSelectedGasto] = useState<GastoTaller | null>(null)
  const [newGasto, setNewGasto] = useState<GastoTallerCreate>({
    descripcion: "",
    monto: 0,
    categoria: "",
    fecha_gasto: new Date().toISOString().split('T')[0]
  })
  const [categoriaPersonalizada, setCategoriaPersonalizada] = useState("")
  const [editGasto, setEditGasto] = useState<GastoTallerCreate>({
    descripcion: "",
    monto: 0,
    categoria: "",
    fecha_gasto: new Date().toISOString().split('T')[0]
  })
  const [editCategoriaPersonalizada, setEditCategoriaPersonalizada] = useState("")

  // Estados para pagos de salarios
  const [pagosSalarios, setPagosSalarios] = useState<PagoSalario[]>([])
  const [loadingPagos, setLoadingPagos] = useState(true)
  const [errorPagos, setErrorPagos] = useState<string | null>(null)
  const [isPagoSalariosDialogOpen, setIsPagoSalariosDialogOpen] = useState(false)
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([])
  const [nuevoPagoSalario, setNuevoPagoSalario] = useState<PagoSalarioCreate>({
    id_mecanico: "",
    monto_salario: 0,
    semana_pago: "",
    fecha_pago: new Date().toISOString().split('T')[0]
  })

  // Estados generales
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Categorías predefinidas para gastos
  const categoriasGastos = [
    { value: "luz", label: "Luz", icon: Zap },
    { value: "agua", label: "Agua", icon: Droplets },
    { value: "herramientas", label: "Herramientas", icon: Wrench },
    { value: "materiales", label: "Materiales", icon: Wrench },
    { value: "servicios", label: "Servicios", icon: Wrench },
    { value: "otros", label: "Otros", icon: Wrench }
  ]

  // Función para obtener la semana actual en formato ISO
  const obtenerSemanaActual = useCallback(() => {
    const fecha = new Date()
    const año = fecha.getFullYear()
    const semana = Math.ceil((fecha.getDate() + new Date(fecha.getFullYear(), fecha.getMonth(), 1).getDay()) / 7)
    return `${año}-W${semana.toString().padStart(2, '0')}`
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = useCallback(async () => {
    try {
      // Cargar gastos del taller
      await cargarGastos()
      // Cargar pagos de salarios
      await cargarPagosSalarios()
      // Cargar mecánicos
      await cargarMecanicos()
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }, [])

  // Función para cargar gastos del taller
  const cargarGastos = useCallback(async () => {
    try {
      setLoadingGastos(true)
      setErrorGastos(null)
      
      // TODO: Implementar llamada a la API cuando esté lista
      // const response = await fetch('/api/gastos-taller')
      // const data = await response.json()
      // setGastos(data)
      
      // Datos de ejemplo por ahora
      setGastos([
        {
          id: "1",
          descripcion: "Pago de luz del mes",
          monto: 45000,
          categoria: "luz",
          fecha_gasto: "2025-01-15",
          created_at: "2025-01-15T10:00:00Z",
          updated_at: "2025-01-15T10:00:00Z"
        },
        {
          id: "2",
          descripcion: "Pago de agua",
          monto: 15000,
          categoria: "agua",
          fecha_gasto: "2025-01-10",
          created_at: "2025-01-10T10:00:00Z",
          updated_at: "2025-01-10T10:00:00Z"
        }
      ])
    } catch (error) {
      console.error("Error al cargar gastos:", error)
      setErrorGastos("Error al cargar los gastos del taller")
    } finally {
      setLoadingGastos(false)
    }
  }, [])

  // Función para cargar pagos de salarios
  const cargarPagosSalarios = useCallback(async () => {
    try {
      setLoadingPagos(true)
      setErrorPagos(null)
      
      // TODO: Implementar llamada a la API cuando esté lista
      // const response = await fetch('/api/pagos-salarios')
      // const data = await response.json()
      // setPagosSalarios(data)
      
      // Datos de ejemplo por ahora
      setPagosSalarios([
        {
          id: "1",
          id_mecanico: "1",
          nombre_mecanico: "Juan Pérez",
          monto_salario: 80000,
          semana_pago: "2025-W01",
          fecha_pago: "2025-01-06",
          created_at: "2025-01-06T10:00:00Z"
        }
      ])
    } catch (error) {
      console.error("Error al cargar pagos de salarios:", error)
      setErrorPagos("Error al cargar los pagos de salarios")
    } finally {
      setLoadingPagos(false)
    }
  }, [])

  // Función para cargar mecánicos
  const cargarMecanicos = useCallback(async () => {
    try {
      // TODO: Implementar llamada a la API cuando esté lista
      // const response = await fetch('/api/mecanicos')
      // const data = await response.json()
      // setMecanicos(data)
      
      // Datos de ejemplo por ahora
      setMecanicos([
        { id: "1", nombre: "Juan Pérez" },
        { id: "2", nombre: "Carlos López" },
        { id: "3", nombre: "Miguel Rodríguez" }
      ])
    } catch (error) {
      console.error("Error al cargar mecánicos:", error)
    }
  }, [])

  // Filtrar gastos basado en término de búsqueda
  const filteredGastos = useMemo(() => {
    if (!searchTermGastos) return gastos

    return gastos.filter(
      (gasto) =>
        gasto.descripcion.toLowerCase().includes(searchTermGastos.toLowerCase()) ||
        gasto.categoria.toLowerCase().includes(searchTermGastos.toLowerCase())
    )
  }, [gastos, searchTermGastos])

  // Estadísticas de gastos
  const statsGastos = useMemo(() => {
    const totalGastos = gastos.length
    const totalMonto = gastos.reduce((sum, gasto) => sum + gasto.monto, 0)
    const gastosMes = gastos.filter(gasto => {
      const fechaGasto = new Date(gasto.fecha_gasto)
      const fechaActual = new Date()
      return fechaGasto.getMonth() === fechaActual.getMonth() && 
             fechaGasto.getFullYear() === fechaActual.getFullYear()
    })
    const totalMes = gastosMes.reduce((sum, gasto) => sum + gasto.monto, 0)

    return {
      totalGastos,
      totalMonto,
      totalMes,
      gastosMes: gastosMes.length
    }
  }, [gastos])

  // Estadísticas de salarios
  const statsSalarios = useMemo(() => {
    const totalPagos = pagosSalarios.length
    const totalSalarios = pagosSalarios.reduce((sum, pago) => sum + pago.monto_salario, 0)
    const pagosMes = pagosSalarios.filter(pago => {
      const fechaPago = new Date(pago.fecha_pago)
      const fechaActual = new Date()
      return fechaPago.getMonth() === fechaActual.getMonth() && 
             fechaPago.getFullYear() === fechaActual.getFullYear()
    })
    const totalMes = pagosMes.reduce((sum, pago) => sum + pago.monto_salario, 0)

    return {
      totalPagos,
      totalSalarios,
      totalMes,
      pagosMes: pagosMes.length
    }
  }, [pagosSalarios])

  // Funciones para gastos del taller
  const handleCreateGasto = useCallback(async () => {
    if (!newGasto.descripcion.trim() || !newGasto.categoria.trim() || newGasto.monto <= 0) return

    // Si la categoría es "otros", usar la categoría personalizada
    const categoriaFinal = newGasto.categoria === "otros" ? categoriaPersonalizada : newGasto.categoria
    if (newGasto.categoria === "otros" && !categoriaPersonalizada.trim()) return

    try {
      // TODO: Implementar llamada a la API cuando esté lista
      // const response = await fetch('/api/gastos-taller', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...newGasto, categoria: categoriaFinal })
      // })
      // const gastoCreado = await response.json()
      
      const gastoCreado: GastoTaller = {
        id: Date.now().toString(),
        ...newGasto,
        categoria: categoriaFinal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setGastos(prev => [...prev, gastoCreado])
      setNewGasto({
        descripcion: "",
        monto: 0,
        categoria: "",
        fecha_gasto: new Date().toISOString().split('T')[0]
      })
      setCategoriaPersonalizada("")
      setIsCreateGastoDialogOpen(false)
    } catch (error) {
      console.error("Error al crear gasto:", error)
    }
  }, [newGasto, categoriaPersonalizada])

  const handleEditGasto = useCallback(async () => {
    if (!selectedGasto || !editGasto.descripcion.trim() || !editGasto.categoria.trim() || editGasto.monto <= 0) return

    // Si la categoría es "otros", usar la categoría personalizada
    const categoriaFinal = editGasto.categoria === "otros" ? editCategoriaPersonalizada : editGasto.categoria
    if (editGasto.categoria === "otros" && !editCategoriaPersonalizada.trim()) return

    try {
      // TODO: Implementar llamada a la API cuando esté lista
      // const response = await fetch(`/api/gastos-taller/${selectedGasto.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...editGasto, categoria: categoriaFinal })
      // })
      
      const gastoActualizado: GastoTaller = {
        ...selectedGasto,
        ...editGasto,
        categoria: categoriaFinal,
        updated_at: new Date().toISOString()
      }
      
      setGastos(prev => prev.map(gasto => 
        gasto.id === selectedGasto.id ? gastoActualizado : gasto
      ))
      setIsEditGastoDialogOpen(false)
      setSelectedGasto(null)
      setEditCategoriaPersonalizada("")
    } catch (error) {
      console.error("Error al editar gasto:", error)
    }
  }, [selectedGasto, editGasto, editCategoriaPersonalizada])

  const handleDeleteGasto = useCallback(async () => {
    if (!selectedGasto) return

    try {
      // TODO: Implementar llamada a la API cuando esté lista
      // await fetch(`/api/gastos-taller/${selectedGasto.id}`, { method: 'DELETE' })
      
      setGastos(prev => prev.filter(gasto => gasto.id !== selectedGasto.id))
      setIsDeleteGastoDialogOpen(false)
      setSelectedGasto(null)
    } catch (error) {
      console.error("Error al eliminar gasto:", error)
    }
  }, [selectedGasto])

  // Funciones para pagos de salarios
  const handlePagoSalarios = useCallback(async () => {
    if (!nuevoPagoSalario.id_mecanico || nuevoPagoSalario.monto_salario <= 0) return

    try {
      // TODO: Implementar llamada a la API cuando esté lista
      // const response = await fetch('/api/pagos-salarios', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(nuevoPagoSalario)
      // })
      // const pagoCreado = await response.json()
      
      const mecanico = mecanicos.find(m => m.id === nuevoPagoSalario.id_mecanico)
      const pagoCreado: PagoSalario = {
        id: Date.now().toString(),
        id_mecanico: nuevoPagoSalario.id_mecanico,
        nombre_mecanico: mecanico?.nombre || "Mecánico",
        monto_salario: nuevoPagoSalario.monto_salario,
        semana_pago: nuevoPagoSalario.semana_pago,
        fecha_pago: nuevoPagoSalario.fecha_pago,
        created_at: new Date().toISOString()
      }
      
      setPagosSalarios(prev => [...prev, pagoCreado])
      setNuevoPagoSalario({
        id_mecanico: "",
        monto_salario: 0,
        semana_pago: obtenerSemanaActual(),
        fecha_pago: new Date().toISOString().split('T')[0]
      })
      setIsPagoSalariosDialogOpen(false)
    } catch (error) {
      console.error("Error al crear pago de salario:", error)
    }
  }, [nuevoPagoSalario, mecanicos, obtenerSemanaActual])

  // Funciones auxiliares
  const openViewGastoDialog = useCallback((gasto: GastoTaller) => {
    setSelectedGasto(gasto)
    setIsViewGastoDialogOpen(true)
  }, [])

  const openEditGastoDialog = useCallback((gasto: GastoTaller) => {
    setSelectedGasto(gasto)
    setEditGasto({
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      categoria: gasto.categoria,
      fecha_gasto: gasto.fecha_gasto
    })
    
    // Si la categoría no está en las predefinidas, es una categoría personalizada
    const categoriaPredefinida = categoriasGastos.find(cat => cat.value === gasto.categoria)
    if (categoriaPredefinida) {
      setEditCategoriaPersonalizada("")
    } else {
      setEditGasto(prev => ({ ...prev, categoria: "otros" }))
      setEditCategoriaPersonalizada(gasto.categoria)
    }
    
    setIsEditGastoDialogOpen(true)
  }, [categoriasGastos])

  const openDeleteGastoDialog = useCallback((gasto: GastoTaller) => {
    setSelectedGasto(gasto)
    setIsDeleteGastoDialogOpen(true)
  }, [])

  const getCategoriaIcon = useCallback((categoria: string) => {
    const cat = categoriasGastos.find(c => c.value === categoria)
    return cat ? cat.icon : Wrench
  }, [categoriasGastos])

  const getCategoriaLabel = useCallback((categoria: string) => {
    const cat = categoriasGastos.find(c => c.value === categoria)
    return cat ? cat.label : categoria
  }, [categoriasGastos])

  return (
    <div className="space-y-6 p-6">
      {/* ======================================== */}
      {/* TARJETA: ESTADÍSTICAS PRINCIPALES */}
      {/* ======================================== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡{statsGastos.totalMonto.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {statsGastos.totalGastos} gastos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡{statsGastos.totalMes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {statsGastos.gastosMes} gastos este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡{statsSalarios.totalSalarios.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {statsSalarios.totalPagos} pagos realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salarios del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₡{statsSalarios.totalMes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {statsSalarios.pagosMes} pagos este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ======================================== */}
      {/* TARJETA: GASTOS DEL TALLER */}
      {/* ======================================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4 text-blue-600" />
            Gastos del Taller
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cargarDatos}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Actualizar
            </Button>
            <Button
              onClick={() => setIsCreateGastoDialogOpen(true)}
              size="sm"
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Nuevo Gasto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Buscar gastos..."
              value={searchTermGastos}
              onChange={(e) => setSearchTermGastos(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loadingGastos ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-lg">Cargando gastos...</span>
            </div>
                     ) : errorGastos ? (
             <ErrorMessage error={new Error(errorGastos)} />
           ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGastos.map((gasto) => {
                    const CategoriaIcon = getCategoriaIcon(gasto.categoria)
                    return (
                      <TableRow key={gasto.id}>
                        <TableCell className="max-w-xs truncate">
                          {gasto.descripcion}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <CategoriaIcon className="h-3 w-3" />
                            {getCategoriaLabel(gasto.categoria)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-red-600">
                          ₡{gasto.monto.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(gasto.fecha_gasto).toLocaleDateString('es-CR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openViewGastoDialog(gasto)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditGastoDialog(gasto)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => openDeleteGastoDialog(gasto)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {filteredGastos.length === 0 && !loadingGastos && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTermGastos ? "No se encontraron gastos con esa búsqueda" : "No hay gastos registrados"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ======================================== */}
      {/* TARJETA: PAGOS DE SALARIOS */}
      {/* ======================================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            Pagos de Salarios
          </CardTitle>
          <Button
            onClick={() => setIsPagoSalariosDialogOpen(true)}
            size="sm"
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Pagar Salarios
          </Button>
        </CardHeader>
        <CardContent>
          {loadingPagos ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-lg">Cargando pagos...</span>
            </div>
                     ) : errorPagos ? (
             <ErrorMessage error={new Error(errorPagos)} />
           ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mecánico</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Semana</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagosSalarios.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell className="font-medium">
                        {pago.nombre_mecanico}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        ₡{pago.monto_salario.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pago.semana_pago}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(pago.fecha_pago).toLocaleDateString('es-CR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {pagosSalarios.length === 0 && !loadingPagos && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg">No hay pagos de salarios registrados</p>
              <p className="text-sm text-gray-500 mt-2">
                Haz clic en "Pagar Salarios" para registrar el primer pago
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ======================================== */}
      {/* DIALOGOS */}
      {/* ======================================== */}

      {/* Dialog para crear nuevo gasto */}
      <Dialog open={isCreateGastoDialogOpen} onOpenChange={setIsCreateGastoDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Gasto del Taller</DialogTitle>
            <DialogDescription>
              Registra un nuevo gasto general del taller
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={newGasto.descripcion}
                onChange={(e) => setNewGasto(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Ej: Pago de luz del mes"
              />
            </div>
                         <div>
               <Label htmlFor="categoria">Categoría</Label>
               <select
                 id="categoria"
                 value={newGasto.categoria}
                 onChange={(e) => setNewGasto(prev => ({ ...prev, categoria: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Seleccionar categoría</option>
                 {categoriasGastos.map((cat) => (
                   <option key={cat.value} value={cat.value}>
                     {cat.label}
                   </option>
                 ))}
               </select>
             </div>
             
             {/* Campo para categoría personalizada */}
             {newGasto.categoria === "otros" && (
               <div>
                 <Label htmlFor="categoria_personalizada">Especificar Categoría</Label>
                 <Input
                   id="categoria_personalizada"
                   value={categoriaPersonalizada}
                   onChange={(e) => setCategoriaPersonalizada(e.target.value)}
                   placeholder="Ej: Mantenimiento, Limpieza, etc."
                 />
               </div>
             )}
                         <div>
               <Label htmlFor="monto">Monto (₡)</Label>
               <Input
                 id="monto"
                 type="number"
                 value={newGasto.monto === 0 ? "" : newGasto.monto}
                 onChange={(e) => setNewGasto(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                 placeholder="0.00"
                 min="0"
                 step="0.01"
               />
             </div>
            <div>
              <Label htmlFor="fecha_gasto">Fecha del Gasto</Label>
              <Input
                id="fecha_gasto"
                type="date"
                value={newGasto.fecha_gasto}
                onChange={(e) => setNewGasto(prev => ({ ...prev, fecha_gasto: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGastoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGasto}>
              Crear Gasto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para pagar salarios */}
      <Dialog open={isPagoSalariosDialogOpen} onOpenChange={setIsPagoSalariosDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar Salarios</DialogTitle>
            <DialogDescription>
              Registra el pago de salarios semanales a los mecánicos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mecanico">Mecánico</Label>
              <select
                id="mecanico"
                value={nuevoPagoSalario.id_mecanico}
                onChange={(e) => setNuevoPagoSalario(prev => ({ ...prev, id_mecanico: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar mecánico</option>
                {mecanicos.map((mecanico) => (
                  <option key={mecanico.id} value={mecanico.id}>
                    {mecanico.nombre}
                  </option>
                ))}
              </select>
            </div>
                         <div>
               <Label htmlFor="monto_salario">Monto del Salario (₡)</Label>
               <Input
                 id="monto_salario"
                 type="number"
                 value={nuevoPagoSalario.monto_salario === 0 ? "" : nuevoPagoSalario.monto_salario}
                 onChange={(e) => setNuevoPagoSalario(prev => ({ ...prev, monto_salario: parseFloat(e.target.value) || 0 }))}
                 placeholder="0.00"
                 min="0"
                 step="0.01"
               />
             </div>
            <div>
              <Label htmlFor="semana_pago">Semana de Pago</Label>
              <Input
                id="semana_pago"
                type="text"
                value={nuevoPagoSalario.semana_pago}
                onChange={(e) => setNuevoPagoSalario(prev => ({ ...prev, semana_pago: e.target.value }))}
                placeholder="2025-W01"
              />
            </div>
            <div>
              <Label htmlFor="fecha_pago">Fecha del Pago</Label>
              <Input
                id="fecha_pago"
                type="date"
                value={nuevoPagoSalario.fecha_pago}
                onChange={(e) => setNuevoPagoSalario(prev => ({ ...prev, fecha_pago: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPagoSalariosDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePagoSalarios}>
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver gasto */}
      <Dialog open={isViewGastoDialogOpen} onOpenChange={setIsViewGastoDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Gasto</DialogTitle>
          </DialogHeader>
          {selectedGasto && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900">ID del Gasto</p>
                <p className="text-lg font-mono text-blue-700">#{selectedGasto.id}</p>
              </div>

              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Descripción</p>
                  <p className="text-lg">{selectedGasto.descripcion}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Categoría</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const CategoriaIcon = getCategoriaIcon(selectedGasto.categoria)
                      return (
                        <>
                          <CategoriaIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-lg">{getCategoriaLabel(selectedGasto.categoria)}</span>
                        </>
                      )
                    })()}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Monto</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-600" />
                    <span className="text-lg font-semibold text-red-600">
                      ₡{selectedGasto.monto.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha del Gasto</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span>{new Date(selectedGasto.fecha_gasto).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewGastoDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar gasto */}
      <Dialog open={isEditGastoDialogOpen} onOpenChange={setIsEditGastoDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Gasto del Taller</DialogTitle>
            <DialogDescription>
              Modifica la información del gasto seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_descripcion">Descripción</Label>
              <Input
                id="edit_descripcion"
                value={editGasto.descripcion}
                onChange={(e) => setEditGasto(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Ej: Pago de luz del mes"
              />
            </div>
                         <div>
               <Label htmlFor="edit_categoria">Categoría</Label>
               <select
                 id="edit_categoria"
                 value={editGasto.categoria}
                 onChange={(e) => setEditGasto(prev => ({ ...prev, categoria: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Seleccionar categoría</option>
                 {categoriasGastos.map((cat) => (
                   <option key={cat.value} value={cat.value}>
                     {cat.label}
                   </option>
                 ))}
               </select>
             </div>
             
             {/* Campo para categoría personalizada */}
             {editGasto.categoria === "otros" && (
               <div>
                 <Label htmlFor="edit_categoria_personalizada">Especificar Categoría</Label>
                 <Input
                   id="edit_categoria_personalizada"
                   value={editCategoriaPersonalizada}
                   onChange={(e) => setEditCategoriaPersonalizada(e.target.value)}
                   placeholder="Ej: Mantenimiento, Limpieza, etc."
                 />
               </div>
             )}
                         <div>
               <Label htmlFor="edit_monto">Monto (₡)</Label>
               <Input
                 id="edit_monto"
                 type="number"
                 value={editGasto.monto === 0 ? "" : editGasto.monto}
                 onChange={(e) => setEditGasto(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                 placeholder="0.00"
                 min="0"
                 step="0.01"
               />
             </div>
            <div>
              <Label htmlFor="edit_fecha_gasto">Fecha del Gasto</Label>
              <Input
                id="edit_fecha_gasto"
                type="date"
                value={editGasto.fecha_gasto}
                onChange={(e) => setEditGasto(prev => ({ ...prev, fecha_gasto: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGastoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditGasto}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <AlertDialog open={isDeleteGastoDialogOpen} onOpenChange={setIsDeleteGastoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el gasto:
              <br />
              <strong>{selectedGasto?.descripcion}</strong>
              <br />
              <strong>₡{selectedGasto?.monto.toLocaleString()}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGasto} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
