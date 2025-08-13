"use client"

import { useState, useMemo, useCallback } from "react"
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
import { Plus, Search, Eye, Edit, Trash2, UserCog, Wrench, DollarSign, Calendar, TrendingUp } from "lucide-react"
import type { Mechanic, MechanicCreate } from "@/lib/types"

// Mock data generator
const generateMockMechanics = (): Mechanic[] => {
  const names = [
    "Carlos Rodríguez",
    "Miguel Hernández",
    "José García",
    "Antonio López",
    "Francisco Martín",
    "David Sánchez",
    "Juan Pérez",
    "Manuel González",
    "Rafael Jiménez",
    "Pedro Ruiz",
    "Alejandro Moreno",
    "Fernando Díaz",
  ]

  return names.map((name, index) => ({
    id: `mech-${index + 1}`,
    name,
    mechanic_id: `MEC${String(index + 1).padStart(3, "0")}`,
    jobs_completed: Math.floor(Math.random() * 150) + 10,
    total_commission: Math.floor(Math.random() * 50000) + 5000,
    total_profit: Math.floor(Math.random() * 75000) + 8000,
    hire_date: new Date(
      2020 + Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1,
    )
      .toISOString()
      .split("T")[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}

export function MechanicsSection() {
  const [mechanics, setMechanics] = useState<Mechanic[]>(() => generateMockMechanics())
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
  const [newMechanic, setNewMechanic] = useState<MechanicCreate & { id_number?: string }>({
    name: "",
    mechanic_id: "",
    id_number: "",
  })
  const [editMechanic, setEditMechanic] = useState<MechanicCreate>({
    name: "",
    mechanic_id: "",
  })

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

  const handleCreateMechanic = useCallback(() => {
    if (!newMechanic.name.trim() || !newMechanic.mechanic_id.trim()) return

    const mechanic: Mechanic = {
      id: `mech-${Date.now()}`,
      name: newMechanic.name.trim(),
      mechanic_id: newMechanic.mechanic_id.trim(),
      jobs_completed: 0,
      total_commission: 0,
      total_profit: 0,
      hire_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setMechanics((prev) => [...prev, mechanic])
    setNewMechanic({ name: "", mechanic_id: "", id_number: "" })
    setIsCreateDialogOpen(false)
  }, [newMechanic])

  const handleEditMechanic = useCallback(() => {
    if (!selectedMechanic || !editMechanic.name.trim() || !editMechanic.mechanic_id.trim()) return

    setMechanics((prev) =>
      prev.map((mechanic) =>
        mechanic.id === selectedMechanic.id
          ? {
              ...mechanic,
              name: editMechanic.name.trim(),
              mechanic_id: editMechanic.mechanic_id.trim(),
              updated_at: new Date().toISOString(),
            }
          : mechanic,
      ),
    )
    setIsEditDialogOpen(false)
    setSelectedMechanic(null)
  }, [selectedMechanic, editMechanic])

  const handleDeleteMechanic = useCallback(() => {
    if (!selectedMechanic) return

    setMechanics((prev) => prev.filter((mechanic) => mechanic.id !== selectedMechanic.id))
    setIsDeleteDialogOpen(false)
    setSelectedMechanic(null)
  }, [selectedMechanic])

  const openViewDialog = useCallback((mechanic: Mechanic) => {
    setSelectedMechanic(mechanic)
    setIsViewDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((mechanic: Mechanic) => {
    setSelectedMechanic(mechanic)
    setEditMechanic({
      name: mechanic.name,
      mechanic_id: mechanic.mechanic_id,
    })
    setIsEditDialogOpen(true)
  }, [])

  const openDeleteDialog = useCallback((mechanic: Mechanic) => {
    setSelectedMechanic(mechanic)
    setIsDeleteDialogOpen(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mecánicos</h1>
          <p className="text-muted-foreground">Gestiona la información de los mecánicos del taller</p>
        </div>
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
              <div className="grid gap-2">
                <Label htmlFor="mechanic_id">ID del Mecánico</Label>
                <Input
                  id="mechanic_id"
                  value={newMechanic.mechanic_id}
                  onChange={(e) => setNewMechanic((prev) => ({ ...prev, mechanic_id: e.target.value }))}
                  placeholder="Ej: MEC001"
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
            <div className="text-2xl font-bold">${stats.totalCommissions.toLocaleString()}</div>
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
                    <Badge variant="secondary">{mechanic.jobs_completed}</Badge>
                  </TableCell>
                  <TableCell>${mechanic.total_commission.toLocaleString()}</TableCell>
                  <TableCell>{new Date(mechanic.hire_date).toLocaleDateString()}</TableCell>
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
          {filteredMechanics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No se encontraron mecánicos</div>
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
                      ${selectedMechanic.total_commission.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Ganancias Generadas</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-lg font-semibold text-emerald-600">
                      ${selectedMechanic.total_profit.toLocaleString()}
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
            <div className="grid gap-2">
              <Label htmlFor="edit-mechanic_id">ID del Mecánico</Label>
              <Input
                id="edit-mechanic_id"
                value={editMechanic.mechanic_id}
                onChange={(e) => setEditMechanic((prev) => ({ ...prev, mechanic_id: e.target.value }))}
                placeholder="Ej: MEC001"
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
                  <strong>Comisiones:</strong> ${selectedMechanic.total_commission.toLocaleString()}
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
