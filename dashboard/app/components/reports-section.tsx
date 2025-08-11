"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Download } from "lucide-react"

interface MonthlyReport {
  month: string
  year: number
  totalIncome: number
  totalExpenses: number
  netProfit: number
}

interface WorkOrderReport {
  id: string
  date: string
  licensePlate: string
  clientName: string
  description: string
  income: number
  expenses: number
  profit: number
}

export function ReportsSection() {
  const [selectedMonth, setSelectedMonth] = useState("2024-01")

  // Mock data - En producción esto vendría de la API
  const monthlyReports: MonthlyReport[] = [
    {
      month: "Enero",
      year: 2024,
      totalIncome: 125000,
      totalExpenses: 45000,
      netProfit: 80000,
    },
    {
      month: "Diciembre",
      year: 2023,
      totalIncome: 98000,
      totalExpenses: 38000,
      netProfit: 60000,
    },
    {
      month: "Noviembre",
      year: 2023,
      totalIncome: 110000,
      totalExpenses: 42000,
      netProfit: 68000,
    },
  ]

  const workOrdersReport: WorkOrderReport[] = [
    {
      id: "WO-001",
      date: "2024-01-15",
      licensePlate: "ABC-123",
      clientName: "Juan Pérez García",
      description: "Cambio de aceite y filtros, revisión general",
      income: 1200,
      expenses: 350,
      profit: 850,
    },
    {
      id: "WO-002",
      date: "2024-01-16",
      licensePlate: "XYZ-789",
      clientName: "María García López",
      description: "Reparación de frenos delanteros y traseros",
      income: 2500,
      expenses: 800,
      profit: 1700,
    },
    {
      id: "WO-003",
      date: "2024-01-17",
      licensePlate: "DEF-456",
      clientName: "Carlos López Martínez",
      description: "Revisión general del motor y cambio de bujías",
      income: 3500,
      expenses: 1200,
      profit: 2300,
    },
    {
      id: "WO-004",
      date: "2024-01-18",
      licensePlate: "GHI-789",
      clientName: "Ana Rodríguez",
      description: "Cambio de llantas y alineación",
      income: 4200,
      expenses: 2800,
      profit: 1400,
    },
    {
      id: "WO-005",
      date: "2024-01-19",
      licensePlate: "JKL-012",
      clientName: "Pedro Martínez",
      description: "Reparación de transmisión",
      income: 8500,
      expenses: 3500,
      profit: 5000,
    },
    {
      id: "WO-006",
      date: "2024-01-20",
      licensePlate: "MNO-345",
      clientName: "Laura Sánchez",
      description: "Cambio de batería y alternador",
      income: 2800,
      expenses: 1800,
      profit: 1000,
    },
    {
      id: "WO-007",
      date: "2024-01-22",
      licensePlate: "PQR-678",
      clientName: "Roberto González",
      description: "Servicio de aire acondicionado",
      income: 1800,
      expenses: 600,
      profit: 1200,
    },
    {
      id: "WO-008",
      date: "2024-01-23",
      licensePlate: "STU-901",
      clientName: "Carmen Jiménez",
      description: "Cambio de amortiguadores",
      income: 3200,
      expenses: 1900,
      profit: 1300,
    },
  ]

  const currentReport = monthlyReports[0] // Enero 2024
  const previousReport = monthlyReports[1] // Diciembre 2023

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <div className="h-4 w-4" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-600"
  }

  const incomeChange = calculatePercentageChange(currentReport.totalIncome, previousReport.totalIncome)
  const expenseChange = calculatePercentageChange(currentReport.totalExpenses, previousReport.totalExpenses)
  const profitChange = calculatePercentageChange(currentReport.netProfit, previousReport.netProfit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Reportes Financieros</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Análisis detallado de ingresos, gastos y ganancias del taller
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-01">Enero 2024</SelectItem>
              <SelectItem value="2023-12">Diciembre 2023</SelectItem>
              <SelectItem value="2023-11">Noviembre 2023</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar Reporte</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Card className="aspect-square sm:aspect-auto">
          <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                {formatCurrency(currentReport.totalIncome)}
              </div>
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${getChangeColor(incomeChange)}`}>
                {getChangeIcon(incomeChange)}
                <span>{Math.abs(incomeChange).toFixed(1)}% vs mes anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="aspect-square sm:aspect-auto">
          <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Gastos Totales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                {formatCurrency(currentReport.totalExpenses)}
              </div>
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${getChangeColor(-expenseChange)}`}>
                {getChangeIcon(-expenseChange)}
                <span>{Math.abs(expenseChange).toFixed(1)}% vs mes anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="aspect-square sm:aspect-auto">
          <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Ganancia Neta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                {formatCurrency(currentReport.netProfit)}
              </div>
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${getChangeColor(profitChange)}`}>
                {getChangeIcon(profitChange)}
                <span>{Math.abs(profitChange).toFixed(1)}% vs mes anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison */}
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Comparación Mensual
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Mes</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Ingresos</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Gastos</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Ganancia</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReports.map((report, index) => (
                    <TableRow key={`${report.month}-${report.year}`} className="hover:bg-gray-50">
                      <TableCell className="font-medium px-2 sm:px-4 text-xs sm:text-sm">
                        {report.month} {report.year}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-green-600">
                        {formatCurrency(report.totalIncome)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-red-600 hidden sm:table-cell">
                        {formatCurrency(report.totalExpenses)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-blue-600">
                        {formatCurrency(report.netProfit)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">
                        {((report.netProfit / report.totalIncome) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders for the Month */}
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Trabajos del Mes - Enero 2024</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lista completa de todos los trabajos realizados en el mes seleccionado
          </p>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Fecha</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">ID</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Placa</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Cliente</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Descripción</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">Ingresos</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">Gastos</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Ganancia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrdersReport.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm">{formatDate(order.date)}</TableCell>
                      <TableCell className="font-medium px-2 sm:px-4 text-xs sm:text-sm">{order.id}</TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm">{order.licensePlate}</TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell max-w-[120px] truncate">
                        {order.clientName}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm max-w-[150px] sm:max-w-xs truncate">
                        {order.description}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-green-600 hidden md:table-cell">
                        {formatCurrency(order.income)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-red-600 hidden md:table-cell">
                        {formatCurrency(order.expenses)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-blue-600">
                        {formatCurrency(order.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Trabajos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{workOrdersReport.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Ingreso Promedio</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(workOrdersReport.reduce((sum, order) => sum + order.income, 0) / workOrdersReport.length)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Gasto Promedio</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {formatCurrency(
                workOrdersReport.reduce((sum, order) => sum + order.expenses, 0) / workOrdersReport.length,
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Margen Promedio</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {(
                (workOrdersReport.reduce((sum, order) => sum + order.profit, 0) /
                  workOrdersReport.reduce((sum, order) => sum + order.income, 0)) *
                100
              ).toFixed(1)}
              %
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
