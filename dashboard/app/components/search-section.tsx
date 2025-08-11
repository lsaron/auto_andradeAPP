"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, User, Car, History, Phone, Mail, MapPin, Calendar, Wrench } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  registrationDate: string
  totalSpent: number
}

interface Vehicle {
  id: string
  licensePlate: string
  brand: string
  model: string
  year: number
  color: string
  vin: string
  ownerId: string
  ownerName: string
  registrationDate: string
  mileage: number
}

interface WorkOrder {
  id: string
  vehicleId: string
  licensePlate: string
  clientId: string
  clientName: string
  description: string
  totalCost: number
  date: string
  mechanicName: string
  parts: string[]
  laborHours: number
}

interface OwnershipHistory {
  id: string
  vehicleId: string
  ownerId: string
  ownerName: string
  startDate: string
  endDate?: string
  transferReason?: string
}

export function SearchSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{
    clients: Client[]
    vehicles: Vehicle[]
  }>({ clients: [], vehicles: [] })
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Mock data - En producción esto vendría de la API
  const mockClients: Client[] = [
    {
      id: "1",
      name: "Juan Pérez García",
      email: "juan.perez@email.com",
      phone: "+52 555 123 4567",
      address: "Av. Principal 123, Col. Centro, Ciudad de México",
      registrationDate: "2023-01-15",
      totalSpent: 25000,
    },
    {
      id: "2",
      name: "María García López",
      email: "maria.garcia@email.com",
      phone: "+52 555 987 6543",
      address: "Calle Secundaria 456, Col. Roma Norte, Ciudad de México",
      registrationDate: "2023-03-20",
      totalSpent: 18500,
    },
    {
      id: "3",
      name: "Carlos López Martínez",
      email: "carlos.lopez@email.com",
      phone: "+52 555 456 7890",
      address: "Boulevard Norte 789, Col. Polanco, Ciudad de México",
      registrationDate: "2022-11-10",
      totalSpent: 42000,
    },
  ]

  const mockVehicles: Vehicle[] = [
    {
      id: "1",
      licensePlate: "ABC-123",
      brand: "Toyota",
      model: "Corolla",
      year: 2020,
      color: "Blanco",
      vin: "1HGBH41JXMN109186",
      ownerId: "1",
      ownerName: "Juan Pérez García",
      registrationDate: "2023-01-15",
      mileage: 45000,
    },
    {
      id: "2",
      licensePlate: "XYZ-789",
      brand: "Honda",
      model: "Civic",
      year: 2019,
      color: "Azul",
      vin: "2HGFC2F59KH123456",
      ownerId: "2",
      ownerName: "María García López",
      registrationDate: "2023-03-20",
      mileage: 62000,
    },
    {
      id: "3",
      licensePlate: "DEF-456",
      brand: "Ford",
      model: "Focus",
      year: 2021,
      color: "Negro",
      vin: "3FADP4EJ5KM123789",
      ownerId: "3",
      ownerName: "Carlos López Martínez",
      registrationDate: "2022-11-10",
      mileage: 28000,
    },
    {
      id: "4",
      licensePlate: "GHI-789",
      brand: "Chevrolet",
      model: "Aveo",
      year: 2018,
      color: "Rojo",
      vin: "4T1BF1FK5KU123456",
      ownerId: "1",
      ownerName: "Juan Pérez García",
      registrationDate: "2023-06-01",
      mileage: 75000,
    },
  ]

  const mockWorkOrders: WorkOrder[] = [
    {
      id: "WO-001",
      vehicleId: "1",
      licensePlate: "ABC-123",
      clientId: "1",
      clientName: "Juan Pérez García",
      description: "Cambio de aceite y filtros, revisión general",
      totalCost: 1200,
      date: "2024-01-15",
      mechanicName: "Roberto Méndez",
      parts: ["Aceite 5W-30", "Filtro de aceite", "Filtro de aire"],
      laborHours: 2,
    },
    {
      id: "WO-002",
      vehicleId: "2",
      licensePlate: "XYZ-789",
      clientId: "2",
      clientName: "María García López",
      description: "Reparación de frenos delanteros y traseros",
      totalCost: 2500,
      date: "2024-01-16",
      mechanicName: "Luis Hernández",
      parts: ["Pastillas de freno", "Discos de freno", "Líquido de frenos"],
      laborHours: 4,
    },
    {
      id: "WO-003",
      vehicleId: "3",
      licensePlate: "DEF-456",
      clientId: "3",
      clientName: "Carlos López Martínez",
      description: "Revisión general del motor y cambio de bujías",
      totalCost: 3500,
      date: "2024-01-10",
      mechanicName: "Roberto Méndez",
      parts: ["Bujías", "Cables de bujías", "Filtro de combustible"],
      laborHours: 6,
    },
    {
      id: "WO-004",
      vehicleId: "1",
      licensePlate: "ABC-123",
      clientId: "1",
      clientName: "Juan Pérez García",
      description: "Alineación y balanceo",
      totalCost: 800,
      date: "2023-12-20",
      mechanicName: "Luis Hernández",
      parts: ["Contrapesos"],
      laborHours: 1.5,
    },
    {
      id: "WO-005",
      vehicleId: "4",
      licensePlate: "GHI-789",
      clientId: "1",
      clientName: "Juan Pérez García",
      description: "Cambio de llantas y revisión de suspensión",
      totalCost: 4200,
      date: "2024-01-18",
      mechanicName: "Roberto Méndez",
      parts: ["Llantas 185/65R15", "Amortiguadores"],
      laborHours: 3,
    },
  ]

  const mockOwnershipHistory: OwnershipHistory[] = [
    {
      id: "1",
      vehicleId: "2",
      ownerId: "1",
      ownerName: "Juan Pérez García",
      startDate: "2019-05-15",
      endDate: "2023-03-19",
      transferReason: "Venta",
    },
    {
      id: "2",
      vehicleId: "2",
      ownerId: "2",
      ownerName: "María García López",
      startDate: "2023-03-20",
    },
  ]

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    // Simular delay de búsqueda
    setTimeout(() => {
      const clientResults = mockClients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.phone.includes(searchQuery),
      )

      const vehicleResults = mockVehicles.filter(
        (vehicle) =>
          vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      setSearchResults({ clients: clientResults, vehicles: vehicleResults })
      setIsSearching(false)
    }, 500)
  }

  const getClientVehicles = (clientId: string) => {
    return mockVehicles.filter((vehicle) => vehicle.ownerId === clientId)
  }

  const getClientWorkOrders = (clientId: string) => {
    return mockWorkOrders.filter((order) => order.clientId === clientId)
  }

  const getVehicleWorkOrders = (vehicleId: string) => {
    return mockWorkOrders.filter((order) => order.vehicleId === vehicleId)
  }

  const getVehicleOwnershipHistory = (vehicleId: string) => {
    return mockOwnershipHistory.filter((history) => history.vehicleId === vehicleId)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Búsqueda Avanzada</h1>
        <p className="text-muted-foreground">
          Busca clientes por nombre, email o teléfono. Busca vehículos por placa, marca, modelo o propietario.
        </p>
      </div>

      {/* Barra de búsqueda */}
      <Card className="w-full">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, email, teléfono, placa, marca, modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="text-base sm:text-lg h-10 sm:h-12"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 h-10 sm:h-12 px-4 sm:px-6"
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isSearching ? "Buscando..." : "Buscar"}</span>
              <span className="sm:hidden">{isSearching ? "..." : "Buscar"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados de búsqueda */}
      {(searchResults.clients.length > 0 || searchResults.vehicles.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Clients Results */}
          {searchResults.clients.length > 0 && (
            <Card className="w-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Clientes Encontrados ({searchResults.clients.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                  {searchResults.clients.map((client) => (
                    <div
                      key={client.id}
                      className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{client.name}</h3>
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1">
                        <span>Vehículos: {getClientVehicles(client.id).length}</span>
                        <span className="font-medium">{formatCurrency(client.totalSpent)} gastados</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vehicles Results */}
          {searchResults.vehicles.length > 0 && (
            <Card className="w-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Car className="h-4 w-4 sm:h-5 sm:w-5" />
                  Vehículos Encontrados ({searchResults.vehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                  {searchResults.vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                        <h3 className="font-semibold text-base sm:text-lg">{vehicle.licensePlate}</h3>
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="font-medium">
                          {vehicle.brand} {vehicle.model} {vehicle.year}
                        </div>
                        <div className="text-muted-foreground">Color: {vehicle.color}</div>
                        <div className="text-muted-foreground truncate">Propietario: {vehicle.ownerName}</div>
                        <div className="text-muted-foreground">Kilometraje: {vehicle.mileage.toLocaleString()} km</div>
                      </div>
                      <div className="mt-2 text-xs sm:text-sm">
                        <span>Trabajos: {getVehicleWorkOrders(vehicle.id).length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detalles del cliente seleccionado */}
      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Completa del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="info" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">Información Personal</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="vehicles" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">Vehículos ({getClientVehicles(selectedClient.id).length})</span>
                  <span className="sm:hidden">Vehículos</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">Historial de Trabajos</span>
                  <span className="sm:hidden">Historial</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4 sm:mt-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">Datos de Contacto</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="font-medium truncate">{selectedClient.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{selectedClient.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{selectedClient.phone}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{selectedClient.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">Información del Cliente</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span>Fecha de registro:</span>
                          <span className="text-right">{formatDate(selectedClient.registrationDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total gastado:</span>
                          <span className="font-medium text-right">{formatCurrency(selectedClient.totalSpent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vehículos registrados:</span>
                          <span className="font-medium">{getClientVehicles(selectedClient.id).length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vehicles">
                <div className="space-y-4">
                  {getClientVehicles(selectedClient.id).map((vehicle) => (
                    <div key={vehicle.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{vehicle.licensePlate}</h4>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 text-sm">
                        <div>Marca: {vehicle.brand}</div>
                        <div>Modelo: {vehicle.model}</div>
                        <div>Año: {vehicle.year}</div>
                        <div>Color: {vehicle.color}</div>
                        <div>VIN: {vehicle.vin}</div>
                        <div>Kilometraje: {vehicle.mileage.toLocaleString()} km</div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Registrado: {formatDate(vehicle.registrationDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trabajo</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getClientWorkOrders(selectedClient.id).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.licensePlate}</TableCell>
                          <TableCell className="max-w-xs truncate">{order.description}</TableCell>
                          <TableCell>{formatCurrency(order.totalCost)}</TableCell>
                          <TableCell>{formatDate(order.date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedClient(null)}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalles del vehículo seleccionado */}
      {selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información Completa del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Información del Vehículo</TabsTrigger>
                <TabsTrigger value="history">Historial de Propietarios</TabsTrigger>
                <TabsTrigger value="work">Historial de Trabajos</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Datos del Vehículo</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Placa:</span>
                          <span className="font-medium">{selectedVehicle.licensePlate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Marca:</span>
                          <span>{selectedVehicle.brand}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Modelo:</span>
                          <span>{selectedVehicle.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Año:</span>
                          <span>{selectedVehicle.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Color:</span>
                          <span>{selectedVehicle.color}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VIN:</span>
                          <span className="font-mono text-xs">{selectedVehicle.vin}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Propietario</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Propietario actual:</span>
                          <span className="font-medium">{selectedVehicle.ownerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kilometraje:</span>
                          <span>{selectedVehicle.mileage.toLocaleString()} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fecha de registro:</span>
                          <span>{formatDate(selectedVehicle.registrationDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trabajos realizados:</span>
                          <span className="font-medium">{getVehicleWorkOrders(selectedVehicle.id).length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Historial de Propietarios
                  </h4>
                  {getVehicleOwnershipHistory(selectedVehicle.id).length > 0 ? (
                    <div className="space-y-3">
                      {getVehicleOwnershipHistory(selectedVehicle.id).map((history) => (
                        <div key={history.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium">{history.ownerName}</h5>
                            <Badge variant="outline">
                              {history.endDate ? "Propietario anterior" : "Propietario actual"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
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
                            {history.transferReason && <div>Motivo del cambio: {history.transferReason}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay historial de cambios de propietario disponible</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="work">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Historial de Trabajos
                  </h4>
                  {getVehicleWorkOrders(selectedVehicle.id).length > 0 ? (
                    <div className="space-y-4">
                      {getVehicleWorkOrders(selectedVehicle.id).map((order) => (
                        <div key={order.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-medium">{order.id}</h5>
                              <p className="text-sm text-muted-foreground">{formatDate(order.date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">{formatCurrency(order.totalCost)}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Descripción:</span> {order.description}
                            </div>
                            <div>
                              <span className="font-medium">Mecánico:</span> {order.mechanicName}
                            </div>
                            <div>
                              <span className="font-medium">Horas de trabajo:</span> {order.laborHours}h
                            </div>
                            <div>
                              <span className="font-medium">Partes utilizadas:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {order.parts.map((part, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {part}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay historial de trabajos disponible para este vehículo</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedVehicle(null)}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay resultados */}
      {searchQuery && !isSearching && searchResults.clients.length === 0 && searchResults.vehicles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron resultados</h3>
            <p className="text-muted-foreground">
              No se encontraron clientes o vehículos que coincidan con "{searchQuery}"
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Intenta buscar por nombre, email, teléfono, placa, marca o modelo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
