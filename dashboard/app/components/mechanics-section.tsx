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
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
  const [newMechanic, setNewMechanic] = useState<MechanicCreate & { id_number?: string }>({
    name: "",
    id_number: "",
  })
  const [editMechanic, setEditMechanic] = useState<MechanicCreate>({
    name: "",
  })

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
    </div>
  )
}
