"use client"

import React, { useState, useEffect } from "react"
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
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([])
  const [workOrdersReport, setWorkOrdersReport] = useState<WorkOrderReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null)
  const [previousReport, setPreviousReport] = useState<MonthlyReport | null>(null)

  // Cargar datos reales del backend
  const loadReportsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener todos los trabajos del backend
      const response = await fetch("http://localhost:8000/api/trabajos/")
      if (!response.ok) {
        throw new Error("Error al cargar los trabajos")
      }

      const trabajos = await response.json()
      console.log("📊 Trabajos cargados:", trabajos)
      console.log("📊 Total de trabajos:", trabajos.length)

      // Transformar datos del backend al formato del frontend
      const transformedWorkOrders: WorkOrderReport[] = trabajos.map((trabajo: any) => ({
        id: `WO-${trabajo.id.toString().padStart(3, '0')}`,
        date: trabajo.fecha,
        licensePlate: trabajo.matricula_carro,
        clientName: trabajo.cliente_nombre,
        description: trabajo.descripcion,
        income: trabajo.costo,
        expenses: trabajo.total_gastos,
        profit: trabajo.ganancia,
      }))

      setWorkOrdersReport(transformedWorkOrders)

      // Generar reportes mensuales basados en los datos reales
      const monthlyData = generateMonthlyReports(transformedWorkOrders)
      setMonthlyReports(monthlyData)

      // Establecer mes actual y anterior
      if (monthlyData.length > 0) {
        setCurrentReport(monthlyData[0])
        setPreviousReport(monthlyData.length > 1 ? monthlyData[1] : null)
        
        // Establecer el año y mes seleccionado por defecto
        const currentMonth = monthlyData[0]
        const monthNumber = getMonthNumber(currentMonth.month)
        const defaultMonth = `${currentMonth.year}-${String(monthNumber).padStart(2, '0')}`
        
        console.log("🔍 Año por defecto establecido:", currentMonth.year)
        console.log("🔍 Mes por defecto establecido:", defaultMonth)
        setSelectedYear(currentMonth.year.toString())
        setSelectedMonth(defaultMonth)
      }

    } catch (error) {
      console.error("Error cargando reportes:", error)
      setError("Error al cargar los datos de reportes")
    } finally {
      setLoading(false)
    }
  }

  // Función para generar reportes mensuales
  const generateMonthlyReports = (workOrders: WorkOrderReport[]): MonthlyReport[] => {
    const monthlyMap = new Map<string, MonthlyReport>()

    workOrders.forEach(order => {
      const date = new Date(order.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('es-ES', { month: 'long' })
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          year: date.getFullYear(),
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
        })
      }

      const monthData = monthlyMap.get(monthKey)!
      monthData.totalIncome += order.income
      monthData.totalExpenses += order.expenses
      monthData.netProfit += order.profit
    })

    // Ordenar por fecha (más reciente primero)
    return Array.from(monthlyMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return getMonthNumber(b.month) - getMonthNumber(a.month)
      })
  }

  // Función auxiliar para obtener número del mes
  const getMonthNumber = (monthName: string): number => {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]
    return months.findIndex(m => m.toLowerCase() === monthName.toLowerCase()) + 1
  }

  // Función para obtener años únicos de los reportes
  const getUniqueYears = () => {
    const years = [...new Set(monthlyReports.map(report => report.year))]
    return years.sort((a, b) => b - a) // Ordenar de más reciente a más antiguo
  }

  // Función para filtrar reportes por año
  const getReportsForYear = (year: number) => {
    return monthlyReports.filter(report => report.year === year)
  }

  // Filtrar trabajos por año y mes seleccionado
  const getWorkOrdersForSelectedMonth = () => {
    if (!selectedYear || !selectedMonth) return workOrdersReport
    
    const [year, month] = selectedMonth.split('-')
    console.log("🔍 Filtrando por año:", selectedYear, "y mes:", year, month)
    
    const filtered = workOrdersReport.filter(order => {
      const orderDate = new Date(order.date)
      const orderYear = orderDate.getFullYear()
      const orderMonth = orderDate.getMonth() + 1
      
      console.log("🔍 Orden:", order.id, "Fecha:", orderDate, "Año:", orderYear, "Mes:", orderMonth)
      
      return orderYear === parseInt(selectedYear) && orderMonth === parseInt(month)
    })
    
    console.log("🔍 Trabajos filtrados:", filtered.length)
    return filtered
  }

  // Obtener trabajos del mes seleccionado
  const filteredWorkOrders = getWorkOrdersForSelectedMonth()

  // Cargar datos al montar el componente
  useEffect(() => {
    loadReportsData()
  }, [])

  // Actualizar mes seleccionado cuando cambie el año
  useEffect(() => {
    if (selectedYear && monthlyReports.length > 0) {
      // Buscar el primer mes disponible del año seleccionado
      const yearReports = getReportsForYear(parseInt(selectedYear))
      if (yearReports.length > 0) {
        const firstMonth = yearReports[0]
        const monthNumber = getMonthNumber(firstMonth.month)
        const newMonth = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`
        setSelectedMonth(newMonth)
        console.log("🔍 Mes actualizado al cambiar año:", newMonth)
      }
    }
  }, [selectedYear, monthlyReports])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
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

  // Calcular cambios porcentuales solo si hay reportes disponibles
  const incomeChange = currentReport && previousReport 
    ? calculatePercentageChange(currentReport.totalIncome, previousReport.totalIncome)
    : 0
  const expenseChange = currentReport && previousReport 
    ? calculatePercentageChange(currentReport.totalExpenses, previousReport.totalExpenses)
    : 0
  const profitChange = currentReport && previousReport 
    ? calculatePercentageChange(currentReport.netProfit, previousReport.netProfit)
    : 0

  // Mostrar estado de carga o error
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error al cargar reportes</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadReportsData} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // Si no hay datos, mostrar mensaje
  if (!currentReport || monthlyReports.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No hay datos disponibles</h2>
          <p className="text-muted-foreground">No se encontraron trabajos para generar reportes</p>
        </div>
      </div>
    )
  }

  // Si no hay datos para el año seleccionado
  if (selectedYear && getReportsForYear(parseInt(selectedYear)).length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No hay datos para {selectedYear}</h2>
          <p className="text-muted-foreground">Selecciona otro año o mes para ver los reportes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Reportes Financieros
            {selectedYear && selectedMonth && (
              <span className="block text-lg sm:text-xl font-normal text-muted-foreground mt-1">
                {selectedMonth.split('-')[1]}/{selectedYear}
              </span>
            )}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Análisis detallado de ingresos, gastos y ganancias del taller
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {/* Selector de Año */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {getUniqueYears().length > 0 ? (
                getUniqueYears().map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No hay años disponibles
                </div>
              )}
            </SelectContent>
          </Select>

          {/* Selector de Mes */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {selectedYear ? (
                getReportsForYear(parseInt(selectedYear)).length > 0 ? (
                  getReportsForYear(parseInt(selectedYear)).map((report) => (
                    <SelectItem 
                      key={`${report.year}-${String(getMonthNumber(report.month)).padStart(2, '0')}`}
                      value={`${report.year}-${String(getMonthNumber(report.month)).padStart(2, '0')}`}
                    >
                      {report.month}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hay datos para {selectedYear}
                  </div>
                )
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  Selecciona un año primero
                </div>
              )}
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
              {selectedYear && selectedMonth && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({selectedMonth.split('-')[1]}/{selectedYear})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                {formatCurrency(currentReport.totalIncome)}
              </div>
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${getChangeColor(incomeChange)}`}>
                {previousReport ? (
                  <>
                    {getChangeIcon(incomeChange)}
                    <span>{Math.abs(incomeChange).toFixed(1)}% vs mes anterior</span>
                  </>
                ) : (
                  <span className="text-gray-500">Primer mes - Sin comparativa</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="aspect-square sm:aspect-auto">
          <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Gastos Totales
              {selectedYear && selectedMonth && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({selectedMonth.split('-')[1]}/{selectedYear})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                {formatCurrency(currentReport.totalExpenses)}
              </div>
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${getChangeColor(-expenseChange)}`}>
                {previousReport ? (
                  <>
                    {getChangeIcon(-expenseChange)}
                    <span>{Math.abs(expenseChange).toFixed(1)}% vs mes anterior</span>
                  </>
                ) : (
                  <span className="text-gray-500">Primer mes - Sin comparativa</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="aspect-square sm:aspect-auto">
          <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Ganancia Neta
              {selectedYear && selectedMonth && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({selectedMonth.split('-')[1]}/{selectedYear})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                {formatCurrency(currentReport.netProfit)}
              </div>
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${getChangeColor(profitChange)}`}>
                {previousReport ? (
                  <>
                    {getChangeIcon(profitChange)}
                    <span>{Math.abs(profitChange).toFixed(1)}% vs mes anterior</span>
                  </>
                ) : (
                  <span className="text-gray-500">Primer mes - Sin comparativa</span>
                )}
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
            Comparación Mensual {selectedYear && selectedMonth && (
              <span className="text-sm font-normal text-muted-foreground">
                - {selectedMonth.split('-')[1]}/{selectedYear}
              </span>
            )}
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
          <CardTitle className="text-lg sm:text-xl">
            Trabajos del Mes {selectedYear && selectedMonth && (
              <span className="text-sm font-normal text-muted-foreground">
                - {selectedMonth.split('-')[1]}/{selectedYear}
              </span>
            )}
          </CardTitle>
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
                  {filteredWorkOrders.length > 0 ? (
                    filteredWorkOrders.map((order) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay trabajos para el período seleccionado
                      </TableCell>
                    </TableRow>
                  )}
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
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total de Trabajos
              {selectedYear && selectedMonth && (
                <span className="text-xs text-muted-foreground font-normal block">
                  {selectedMonth.split('-')[1]}/{selectedYear}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{filteredWorkOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Ingreso Promedio
              {selectedYear && selectedMonth && (
                <span className="text-xs text-muted-foreground font-normal block">
                  {selectedMonth.split('-')[1]}/{selectedYear}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(filteredWorkOrders.length > 0 
                ? filteredWorkOrders.reduce((sum, order) => sum + order.income, 0) / filteredWorkOrders.length
                : 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Gasto Promedio
              {selectedYear && selectedMonth && (
                <span className="text-xs text-muted-foreground font-normal block">
                  {selectedMonth.split('-')[1]}/{selectedYear}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {formatCurrency(
                filteredWorkOrders.length > 0
                  ? filteredWorkOrders.reduce((sum, order) => sum + order.expenses, 0) / filteredWorkOrders.length
                  : 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Margen Promedio
              {selectedYear && selectedMonth && (
                <span className="text-xs text-muted-foreground font-normal block">
                  {selectedMonth.split('-')[1]}/{selectedYear}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {filteredWorkOrders.length > 0 && 
               filteredWorkOrders.reduce((sum, order) => sum + order.income, 0) > 0
                ? (
                    (filteredWorkOrders.reduce((sum, order) => sum + order.profit, 0) /
                     filteredWorkOrders.reduce((sum, order) => sum + order.income, 0)) *
                    100
                  ).toFixed(1)
                : "0.0"
              }%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
