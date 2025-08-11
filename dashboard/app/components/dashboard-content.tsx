"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, ClipboardList, Users, Calendar } from "lucide-react"

export function DashboardContent() {
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = currentDate.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const stats = [
    {
      title: "Total Vehículos",
      value: "156",
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Trabajos",
      value: "342",
      icon: ClipboardList,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Clientes",
      value: "89",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Fecha Actual",
      value: formattedTime,
      subtitle: formattedDate,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Panel Principal</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Bienvenido al sistema de gestión de Auto Andrade</p>
      </div>

      {/* Stats Grid - Responsive with proper aspect ratios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-all duration-200 aspect-square sm:aspect-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor} flex-shrink-0`}>
                <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <div className="text-xs sm:text-sm text-muted-foreground mt-1 leading-tight">{stat.subtitle}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid - Responsive layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Jobs Card */}
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Trabajos Recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {[
                { id: "001", plate: "ABC-123", description: "Cambio de aceite", amount: "$1,200" },
                { id: "002", plate: "XYZ-789", description: "Reparación de frenos", amount: "$850" },
                { id: "003", plate: "DEF-456", description: "Revisión general", amount: "$2,100" },
              ].map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">Trabajo #{job.id}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Placa: {job.plate}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{job.description}</p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
                    <p className="font-medium text-sm sm:text-base">{job.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicles by Brand Card */}
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Vehículos por Marca</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {[
                { brand: "Toyota", count: 45, percentage: 29 },
                { brand: "Honda", count: 32, percentage: 21 },
                { brand: "Ford", count: 28, percentage: 18 },
                { brand: "Chevrolet", count: 25, percentage: 16 },
                { brand: "Otros", count: 26, percentage: 16 },
              ].map((item) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
