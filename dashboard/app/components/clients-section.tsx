"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, Plus, Trash2, Phone, Mail, Search, X, Car, AlertTriangle } from "lucide-react"
import { Client, ClientCreate } from "@/lib/types"

interface Vehicle {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number
  color: string
}

export function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientVehicles, setClientVehicles] = useState<Record<string, Vehicle[]>>({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)
  const [isViewClientModalOpen, setIsViewClientModalOpen] = useState(false)
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState<string>("")
  
  // Estados de paginación
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalClients, setTotalClients] = useState(0)
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [newClient, setNewClient] = useState<ClientCreate>({
    id_nacional: "",
    name: "",
    lastname: "",
    email: "",
    phone: "",
  })
  const [editClient, setEditClient] = useState<ClientCreate>({
    id_nacional: "",
    name: "",
    lastname: "",
    email: "",
    phone: "",
  })

  // Funciones de formateo de teléfono
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return ""
    
    // Remover +506 si existe para procesar solo los números
    let cleanNumber = phone
    if (cleanNumber.startsWith("+506")) {
      cleanNumber = cleanNumber.replace("+506", "").replace(/\D/g, "")
    } else {
      cleanNumber = cleanNumber.replace(/\D/g, "")
    }
    
    // Formatear con +506 y guión
    if (cleanNumber.length >= 8) {
      return `+506 ${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4)}`
    } else if (cleanNumber.length > 0) {
      return `+506 ${cleanNumber}`
    }
    
    return ""
  }

  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return "Sin teléfono"
    return formatPhoneNumber(phone)
  }

  const handlePhoneInput = (value: string, setter: (client: ClientCreate) => void, currentClient: ClientCreate) => {
    // Remover todo excepto números y guiones
    const cleanNumber = value.replace(/[^\d-]/g, "")
    
    // Remover guiones para contar solo dígitos
    const digitsOnly = cleanNumber.replace(/-/g, "")
    
    // Limitar a 8 dígitos (máximo para Costa Rica)
    const limitedDigits = digitsOnly.slice(0, 8)
    
    // Agregar +506 automáticamente solo si hay números
    const formattedNumber = limitedDigits ? `+506${limitedDigits}` : ""
    
    setter({ ...currentClient, phone: formattedNumber })
  }

  // Load clients on component mount
  useEffect(() => {
    console.log("🔍 useEffect triggered - loading clients")
    loadClients(1, true)
  }, [])

  // Debounced search functionality
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // API Functions
  const loadClients = async (pageNum: number, reset = false) => {
    console.log("🔍 loadClients called with:", { pageNum, reset, loading })
    
    if (loading) {
      console.log("🔍 loadClients: already loading, skipping")
      return
    }

    try {
      console.log("🔍 loadClients: starting to load")
      setLoading(true)
      setError(null)
      
      if (reset) {
        setInitialLoading(true)
      }
      
      const response = await fetch("http://localhost:8000/api/clientes/")
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("📋 Clients data received:", data)
      console.log("📋 Number of clients:", data.length)
      
      // Transform backend data to frontend format
      const transformedClients: Client[] = data.map((cliente: any) => ({
        id: cliente.id_nacional,
        name: cliente.nombre,
        lastname: cliente.apellido || "",
        email: cliente.correo || "",
        phone: cliente.telefono || "",
        registration_date: new Date().toISOString().split("T")[0], // Default for now
        total_spent: cliente.total_gastado || 0, // Use total_gastado from backend
        vehicle_count: 0, // Will be updated when loading vehicles
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      // Ordenar por ID descendente (más recientes primero)
      const sortedClients = transformedClients.sort((a, b) => {
        // Usar el ID nacional como criterio de ordenamiento
        return b.id.localeCompare(a.id)
      })

      if (reset) {
        // Mostrar solo los primeros 30 clientes
        const limitedClients = sortedClients.slice(0, 30)
        console.log("🔍 Reset mode - limitedClients:", limitedClients.length)
        setClients(limitedClients)
        setFilteredClients(limitedClients)
        console.log("🔍 Clients state updated, limitedClients:", limitedClients)
        
        // Verificar si hay más clientes
        setHasMore(sortedClients.length > 30)
        setTotalClients(sortedClients.length)
        console.log("🔍 Reset mode - hasMore:", sortedClients.length > 30, "totalClients:", sortedClients.length)
        
        // Load vehicles for the limited clients (async, no await)
        loadClientVehicles(limitedClients).catch(error => {
          console.error("Error loading client vehicles:", error)
        })
      } else {
        // Cargar más clientes (siguientes 20)
        const currentLength = clients.length
        const startIndex = currentLength
        const endIndex = startIndex + 20
        const moreClients = sortedClients.slice(startIndex, endIndex)
        
        console.log("🔍 Load more mode - currentLength:", currentLength, "moreClients:", moreClients.length)
        
        setClients((prev) => [...prev, ...moreClients])
        setFilteredClients((prev) => [...prev, ...moreClients])
        
        // Verificar si hay más clientes por cargar
        setHasMore(endIndex < sortedClients.length)
        
        // Load vehicles for the new clients (async, no await)
        loadClientVehicles(moreClients).catch(error => {
          console.error("Error loading client vehicles:", error)
        })
      }

      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error cargando clientes"))
      if (reset) {
        setClients([])
        setFilteredClients([])
      }
    } finally {
      setLoading(false)
      if (reset) {
        setInitialLoading(false)
      }
    }
  }

  const loadClientVehicles = async (clientsList: Client[]) => {
    try {
      const vehiclesData: Record<string, Vehicle[]> = {}
      
      for (const client of clientsList) {
        try {
          const response = await fetch(`http://localhost:8000/api/clientes/${client.id}`)
          if (response.ok) {
            const clientData = await response.json()
            
            const vehicles: Vehicle[] = (clientData.carros || []).map((carro: any) => ({
              id: carro.matricula,
              license_plate: carro.matricula,
              brand: carro.marca,
              model: carro.modelo,
              year: carro.anio,
              color: "N/A", // Not available in backend
            }))
            
            vehiclesData[client.id] = vehicles
            
            console.log(`🚗 Client ${client.name}: ${vehicles.length} vehicles loaded`)
            
            // Update client with vehicle count
            setClients(prev => {
              const updated = prev.map(c => 
                c.id === client.id 
                  ? { ...c, vehicle_count: vehicles.length }
                  : c
              )
              console.log(`📊 Updated client ${client.name} with ${vehicles.length} vehicles`)
              return updated
            })
            
            // Also update filteredClients
            setFilteredClients(prev => {
              const updated = prev.map(c => 
                c.id === client.id 
                  ? { ...c, vehicle_count: vehicles.length }
                  : c
              )
              return updated
            })
          }
        } catch (error) {
          console.error(`Error loading vehicles for client ${client.id}:`, error)
          vehiclesData[client.id] = []
        }
      }
      
      setClientVehicles(vehiclesData)
      console.log("✅ All client vehicles loaded:", vehiclesData)
    } catch (error) {
      console.error("Error loading client vehicles:", error)
    }
  }

  // Filter clients based on search term
  const displayClients = useMemo(() => {
    if (!debouncedSearchTerm) return filteredClients

    return filteredClients.filter(
      (client) =>
        client.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (client.lastname && client.lastname.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        client.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.phone.includes(debouncedSearchTerm),
    )
  }, [filteredClients, debouncedSearchTerm])

  const handleAddClient = useCallback(async () => {
    // Clear previous validation errors
    setValidationError("")
    
    // Validate required fields
    if (!newClient.id_nacional) {
      setValidationError("El ID Nacional es obligatorio")
      return
    }
    if (!newClient.name) {
      setValidationError("El nombre es obligatorio")
      return
    }
    if (!newClient.email) {
      setValidationError("El email es obligatorio")
      return
    }
    if (!newClient.phone) {
      setValidationError("El teléfono es obligatorio")
      return
    }
    
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/api/clientes/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_nacional: newClient.id_nacional,
          nombre: newClient.name,
          apellido: newClient.lastname,
          correo: newClient.email,
          telefono: newClient.phone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al registrar cliente")
      }

      // Reload clients after adding
      await loadClients(1, true)

      setNewClient({
        id_nacional: "",
        name: "",
        lastname: "",
        email: "",
        phone: "",
      })
      setValidationError("")
      setIsNewClientModalOpen(false)
    } catch (error: any) {
      console.error("Error al registrar cliente:", error)
      alert(error.message || "Error inesperado")
    } finally {
      setIsLoading(false)
    }
  }, [newClient])

  const handleEditClient = useCallback(async () => {
    if (selectedClient && editClient.id_nacional && editClient.name && editClient.email && editClient.phone) {
      setIsLoading(true)

      try {
        const response = await fetch(`http://localhost:8000/api/clientes/${selectedClient.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_nacional: editClient.id_nacional,
            nombre: editClient.name,
            apellido: editClient.lastname,
            correo: editClient.email,
            telefono: editClient.phone,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Error al actualizar cliente")
        }

        // Reload clients after updating
        await loadClients(1, true)

        setEditClient({
          id_nacional: "",
          name: "",
          lastname: "",
          email: "",
          phone: "",
        })
        setSelectedClient(null)
        setIsEditClientModalOpen(false)
      } catch (error: any) {
        console.error("Error al actualizar cliente:", error)
        alert(error.message || "Error inesperado")
      } finally {
        setIsLoading(false)
      }
    }
  }, [selectedClient, editClient])

  const handleDeleteClient = useCallback(async () => {
    if (clientToDelete) {
      setIsLoading(true)

      try {
        const response = await fetch(`http://localhost:8000/api/clientes/${clientToDelete.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Error al eliminar cliente")
        }

        // Reload clients after deleting
        await loadClients(1, true)

        setClientToDelete(null)
        setIsDeleteConfirmOpen(false)
      } catch (error: any) {
        console.error("Error al eliminar cliente:", error)
        alert(error.message || "Error inesperado")
      } finally {
        setIsLoading(false)
      }
    }
  }, [clientToDelete])

  const handleViewClient = useCallback((client: Client) => {
    setSelectedClient(client)
    setIsViewClientModalOpen(true)
  }, [])

  const handleEditClientClick = useCallback((client: Client) => {
    setSelectedClient(client)
    setEditClient({
      id_nacional: client.id,
      name: client.name,
      lastname: client.lastname || "",
      email: client.email,
      phone: client.phone,
    })
    setIsEditClientModalOpen(true)
  }, [])

  const handleDeleteClientClick = useCallback((client: Client) => {
    setClientToDelete(client)
    setIsDeleteConfirmOpen(true)
  }, [])

  // Función para cargar más clientes
  const handleLoadMore = () => {
    if (!loading && hasMore && !searchTerm) {
      loadClients(page + 1, false)
    }
  }

  const handleClearSearch = useCallback(() => {
    setSearchTerm("")
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
    }).format(amount)
  }, [])

  // Calculate statistics (removed total revenue)
  const stats = useMemo(
    () => ({
      totalClients: clients.length,
      totalVehicles: clients.reduce((sum, client) => sum + (client.vehicle_count || 0), 0),
    }),
    [clients],
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Administra la información de todos los clientes</p>
        </div>
        <Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id_nacional" className="text-right">
                  ID Nacional *
                </Label>
                <Input
                  id="id_nacional"
                  value={newClient.id_nacional}
                  onChange={(e) => setNewClient({ ...newClient, id_nacional: e.target.value })}
                  className="col-span-3"
                  placeholder="Cedula de identidad"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastname" className="text-right">
                  Apellido
                </Label>
                <Input
                  id="lastname"
                  value={newClient.lastname || ""}
                  onChange={(e) => setNewClient({ ...newClient, lastname: e.target.value })}
                  className="col-span-3"
                  placeholder="Apellido del cliente"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="col-span-3"
                  placeholder="email"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="phone"
                    value={newClient.phone ? newClient.phone.replace("+506", "").replace(/\D/g, "").replace(/(\d{4})(\d{4})/, "$1-$2") : ""}
                    onChange={(e) => handlePhoneInput(e.target.value, setNewClient, newClient)}
                    className="pl-12"
                    maxLength={9} // 8746-7602
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                    +506
                  </span>
                </div>
              </div>
              
              {/* Validation Error Message */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{validationError}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsNewClientModalOpen(false)
                setValidationError("")
              }}>
                Cancelar
              </Button>
              <Button onClick={handleAddClient} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Registrando..." : "Registrar Cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards (removed total revenue) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Vehículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalVehicles}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 w-full sm:w-64"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {searchTerm && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                Búsqueda: "{searchTerm}"
                <Button variant="ghost" size="sm" onClick={handleClearSearch} className="h-4 w-4 p-0 ml-1">
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}

          {/* Results count */}
          <div className="text-sm text-muted-foreground mt-2">
            {searchTerm ? (
              <>
                Mostrando {displayClients.length} de {filteredClients.length} clientes
              </>
            ) : (
              <>Total: {clients.length} clientes</>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Vehículos</TableHead>
                  <TableHead>Total Gastado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {client.name}{client.lastname ? ` ${client.lastname}` : ''}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {client.email || "Sin email"}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          {formatPhoneForDisplay(client.phone)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.vehicle_count || 0}</Badge>
                      {/* Debug: {console.log(`Rendering vehicle count for ${client.name}:`, client.vehicle_count)} */}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(client.total_spent)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 bg-transparent"
                          onClick={() => handleViewClient(client)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 bg-transparent"
                          onClick={() => handleEditClientClick(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 bg-transparent"
                          onClick={() => handleDeleteClientClick(client)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {displayClients.length === 0 && searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron clientes que coincidan con "{searchTerm}"
              </div>
            )}

            {/* Botón Cargar Más */}
            {!searchTerm && hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  {initialLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Cargar más clientes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Client Modal */}
      <Dialog open={isViewClientModalOpen} onOpenChange={setIsViewClientModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle>Información del Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Add Customer ID display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-blue-700">ID del Cliente:</Label>
                  <p className="text-sm font-mono font-medium text-blue-800">#{selectedClient.id}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                    <p className="text-lg font-medium">
                      {selectedClient.name}{selectedClient.lastname ? ` ${selectedClient.lastname}` : ''}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Total Gastado</Label>
                    <p className="text-lg font-medium text-green-600">{formatCurrency(selectedClient.total_spent)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-base">{selectedClient.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                    <p className="text-base">{formatPhoneForDisplay(selectedClient.phone)}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Car className="h-5 w-5" />
                  <Label className="text-lg font-medium">Vehículos Asociados</Label>
                  <Badge variant="outline">{clientVehicles[selectedClient.id]?.length || 0}</Badge>
                </div>
                {clientVehicles[selectedClient.id] && clientVehicles[selectedClient.id].length > 0 ? (
                  <div className="space-y-2">
                    {clientVehicles[selectedClient.id].map((vehicle: Vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <Car className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{vehicle.license_plate}</p>
                            <p className="text-sm text-gray-600">
                              {vehicle.brand} {vehicle.model}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay vehículos asociados a este cliente</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewClientModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal */}
      <Dialog open={isEditClientModalOpen} onOpenChange={setIsEditClientModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-id_nacional" className="text-right">
                ID Nacional *
              </Label>
              <Input
                id="edit-id_nacional"
                value={editClient.id_nacional}
                onChange={(e) => setEditClient({ ...editClient, id_nacional: e.target.value })}
                className="col-span-3"
                placeholder="123456789"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nombre
              </Label>
              <Input
                id="edit-name"
                value={editClient.name}
                onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                className="col-span-3"
                placeholder="Juan Pérez"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-lastname" className="text-right">
                Apellido
              </Label>
              <Input
                id="edit-lastname"
                value={editClient.lastname || ""}
                onChange={(e) => setEditClient({ ...editClient, lastname: e.target.value })}
                className="col-span-3"
                placeholder="Apellido del cliente"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editClient.email}
                onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                className="col-span-3"
                placeholder="juan@email.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Teléfono
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="edit-phone"
                  value={editClient.phone ? editClient.phone.replace("+506", "").replace(/\D/g, "").replace(/(\d{4})(\d{4})/, "$1-$2") : ""}
                  onChange={(e) => handlePhoneInput(e.target.value, setEditClient, editClient)}
                  className="pl-12"
                  maxLength={9} // 8746-7602
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                  +506
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditClientModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditClient} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          {clientToDelete && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 mb-3">
                  <strong>¡Advertencia!</strong> Esta acción no se puede deshacer.
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">ID Nacional:</span> {clientToDelete.id}
                  </div>
                  <div>
                    <span className="font-medium">Cliente:</span> {clientToDelete.name}{clientToDelete.lastname ? ` ${clientToDelete.lastname}` : ''}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {clientToDelete.email}
                  </div>
                  <div>
                    <span className="font-medium">Teléfono:</span> {formatPhoneForDisplay(clientToDelete.phone)}
                  </div>
                  <div>
                    <span className="font-medium">Vehículos:</span> {clientToDelete.vehicle_count}
                  </div>
                  <div>
                    <span className="font-medium">Total gastado:</span> {formatCurrency(clientToDelete.total_spent)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que deseas eliminar este cliente? Se perderá toda la información asociada.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteClient}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Eliminando..." : "Eliminar Cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
