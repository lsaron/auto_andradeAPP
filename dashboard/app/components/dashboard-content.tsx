"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, ClipboardList, Users, Calendar, TrendingUp, TrendingDown, Building2 } from "lucide-react"

interface DashboardStats {
  totalVehicles: number
  totalWorkOrders: number
  totalClients: number
  totalRevenue: number
  recentWorkOrders: Array<{
    id: string
    licensePlate: string
    description: string
    totalCost: number
    date: string
  }>
  vehiclesByBrand: Array<{
    brand: string
    count: number
    percentage: number
  }>
}

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalWorkOrders: 0,
    totalClients: 0,
    totalRevenue: 0,
    recentWorkOrders: [],
    vehiclesByBrand: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString("es-CR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = currentDate.toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Load dashboard data from API
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load clients
      const clientsResponse = await fetch("http://localhost:8000/api/clientes/")
      const clientsData = await clientsResponse.json()

      // Load vehicles
      const vehiclesResponse = await fetch("http://localhost:8000/api/carros/")
      const vehiclesData = await vehiclesResponse.json()

      // Load work orders
      const workOrdersResponse = await fetch("http://localhost:8000/api/trabajos/")
      const workOrdersData = await workOrdersResponse.json()

      // Calculate total revenue from work orders
      const totalRevenue = workOrdersData.reduce((sum: number, order: any) => sum + (order.costo || 0), 0)

      // Get recent work orders (last 5, ordered by most recent first)
      const recentWorkOrders = workOrdersData
        .sort((a: any, b: any) => b.id - a.id) // Order by ID descending (newest first)
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id,
          licensePlate: order.matricula_carro,
          description: order.descripcion,
          totalCost: order.costo || 0,
          date: order.fecha,
        }))

      // Calculate vehicles by brand
      const brandCounts: { [key: string]: number } = {}
      vehiclesData.forEach((vehicle: any) => {
        const brand = vehicle.marca || "Sin marca"
        brandCounts[brand] = (brandCounts[brand] || 0) + 1
      })

      const totalVehicles = vehiclesData.length
      const vehiclesByBrand = Object.entries(brandCounts)
        .map(([brand, count]) => ({
          brand,
          count,
          percentage: Math.round((count / totalVehicles) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // Top 5 brands

      setStats({
        totalVehicles,
        totalWorkOrders: workOrdersData.length,
        totalClients: clientsData.length,
        totalRevenue,
        recentWorkOrders,
        vehiclesByBrand,
      })
    } catch (err) {
      console.error("Error loading dashboard data:", err)
      setError("Error cargando datos del dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const dashboardStats = [
    {
      title: "Total Vehículos",
      value: stats.totalVehicles.toString(),
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Trabajos",
      value: stats.totalWorkOrders.toString(),
      icon: ClipboardList,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Clientes",
      value: stats.totalClients.toString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },

  ]

  // Add date/time card separately
  const dateTimeCard = {
    title: "Fecha Actual",
    value: formattedTime,
    subtitle: formattedDate,
    icon: Calendar,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Panel Principal</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Bienvenido al sistema de gestión de Auto Andrade</p>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
              <button 
                onClick={loadDashboardData}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Reintentar cargar datos
              </button>
            </div>
          )}
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg 
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Stats Grid - Responsive with proper aspect ratios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {loading ? (
          // Loading skeleton for stats
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 aspect-square sm:aspect-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="p-2 rounded-full bg-gray-200 animate-pulse">
                  <div className="h-4 w-4 bg-gray-300 rounded"></div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {dashboardStats.map((stat) => (
              <Card key={stat.title} className="hover:shadow-lg transition-all duration-200 aspect-square sm:aspect-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium leading-tight">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-full ${stat.bgColor} flex-shrink-0`}>
                    <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
            
            {/* Date/Time Card */}
            <Card className="hover:shadow-lg transition-all duration-200 aspect-square sm:aspect-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium leading-tight">{dateTimeCard.title}</CardTitle>
                <div className={`p-2 rounded-full ${dateTimeCard.bgColor} flex-shrink-0`}>
                  <dateTimeCard.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${dateTimeCard.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{dateTimeCard.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1 leading-tight">{dateTimeCard.subtitle}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Content Grid - Responsive layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Jobs Card */}
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Trabajos Recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Cargando trabajos recientes...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p className="text-sm">{error}</p>
                <button 
                  onClick={loadDashboardData}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : stats.recentWorkOrders.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {stats.recentWorkOrders.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">WO-{String(job.id).padStart(3, '0')}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Placa: {job.licensePlate}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{job.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(job.date)}</p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
                      <p className="font-medium text-sm sm:text-base">{formatCurrency(job.totalCost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No hay trabajos recientes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicles by Brand Card */}
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Vehículos por Marca</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Cargando estadísticas de vehículos...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p className="text-sm">{error}</p>
                <button 
                  onClick={loadDashboardData}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : stats.vehiclesByBrand.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {stats.vehiclesByBrand.map((item) => (
                  <div key={item.brand} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium flex-shrink-0 min-w-0 truncate">{item.brand}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground w-6 sm:w-8 text-right flex-shrink-0">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No hay datos de vehículos disponibles</p>
              </div>
              )}
          </CardContent>
        </Card>

        {/* Taller Overview Card */}
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              Resumen del Taller
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">₡0</p>
                <p className="text-xs text-orange-700">Gastos del Mes</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">₡0</p>
                <p className="text-xs text-green-700">Salarios del Mes</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Gestiona los gastos del taller y pagos de salarios
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
