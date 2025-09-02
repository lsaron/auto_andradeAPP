"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { API_CONFIG, buildApiUrl } from "@/app/lib/api-config"

// Interfaces para los datos
interface WorkOrder {
  id: number
  cliente_nombre: string
  matricula_carro: string
  descripcion: string
  costo: number
  fecha: string
  mano_obra: number
  markup_repuestos: number
  ganancia: number
  aplica_iva: boolean
  cliente_id: string
  total_gastos: number
  ganancia_total: number
  ganancia_base_comisiones: number
  mecanicos_ids: number[]
  mecanicos_nombres: string[]
  total_mecanicos: number
}

interface GastoTaller {
  id: number
  descripcion: string
  monto: number
  fecha: string
  categoria: string
}

interface PagoSalario {
  id: number
  id_mecanico: number
  monto_salario: number
  semana_pago: string
  fecha_pago: string
  mecanico_nombre?: string
}

interface Mecanico {
  id: number
  nombre: string
  activo: boolean
}

interface MonthlyReport {
  month: string
  year: number
  totalIncome: number
  totalExpenses: number
  netProfit: number
  workOrdersCount: number
  gastosTaller: number
  salarios: number
}

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Función para formatear fecha
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Función para obtener el nombre del mes en español
const getMonthName = (monthNumber: number): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[monthNumber - 1] || 'Mes desconocido'
}

export default function ReportsSection() {
  // Estados principales
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [gastosTaller, setGastosTaller] = useState<GastoTaller[]>([])
  const [pagosSalarios, setPagosSalarios] = useState<PagoSalario[]>([])
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([])
  
  // Estados de control
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [availableMonths, setAvailableMonths] = useState<number[]>([])
  
  // Estados para el reset mensual
  const [isCurrentPeriod, setIsCurrentPeriod] = useState(false)
  const [lastResetCheck, setLastResetCheck] = useState<Date>(new Date())

  // Función para verificar si es fin de mes
  const isEndOfMonth = useCallback(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return now.getMonth() !== tomorrow.getMonth()
  }, [])

  // Función para verificar si es lunes
  const isMonday = useCallback(() => {
    return new Date().getDay() === 1
  }, [])

  // Función para verificar si es inicio de mes
  const isStartOfMonth = useCallback(() => {
    return new Date().getDate() <= 7
  }, [])

  // Función para verificar si debe hacer reset automático
  const shouldAutoReset = useCallback(() => {
    return isMonday() && isStartOfMonth() && isEndOfMonth()
  }, [isMonday, isStartOfMonth, isEndOfMonth])

  // Función para cargar datos del backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Cargando datos del backend...')

      // Cargar todos los datos en paralelo
      const [workOrdersRes, gastosRes, salariosRes, mecanicosRes] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TRABAJOS)),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.GASTOS_TALLER)),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PAGOS_SALARIOS)),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.MECANICOS))
      ])

      if (!workOrdersRes.ok) throw new Error(`Error al cargar trabajos: ${workOrdersRes.status}`)
      if (!gastosRes.ok) throw new Error(`Error al cargar gastos: ${gastosRes.status}`)
      if (!salariosRes.ok) throw new Error(`Error al cargar salarios: ${salariosRes.status}`)
      if (!mecanicosRes.ok) throw new Error(`Error al cargar mecánicos: ${mecanicosRes.status}`)

      const [workOrdersData, gastosData, salariosData, mecanicosData] = await Promise.all([
        workOrdersRes.json(),
        gastosRes.json(),
        salariosRes.json(),
        mecanicosRes.json()
      ])

      console.log('✅ Datos cargados:', {
        trabajos: workOrdersData.length,
        gastos: gastosData.length,
        salarios: salariosData.length,
        mecanicos: mecanicosData.length
      })

      setWorkOrders(workOrdersData)
      setGastosTaller(gastosData)
      setPagosSalarios(salariosData)
      setMecanicos(mecanicosData)

      // Procesar años y meses disponibles
      const yearSet = new Set<number>(workOrdersData.map((wo: WorkOrder) => 
        new Date(wo.fecha).getFullYear()
      ))
      const years = Array.from(yearSet).sort((a, b) => b - a)

      setAvailableYears(years)

      // Si no hay años, usar el año actual
      if (years.length === 0) {
        const currentYear = new Date().getFullYear()
        setAvailableYears([currentYear])
        setSelectedYear(currentYear.toString())
      } else {
        // Seleccionar el año más reciente por defecto
        setSelectedYear(years[0].toString())
      }

      console.log('🔍 Años disponibles:', years)
      console.log('🔍 Año seleccionado:', years[0] || 'Ninguno')

    } catch (err) {
      console.error('❌ Error al cargar datos:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Función para actualizar meses disponibles cuando cambia el año
  const updateAvailableMonths = useCallback((year: number) => {
    const monthSet = new Set<number>(workOrders
      .filter(wo => new Date(wo.fecha).getFullYear() === year)
      .map(wo => new Date(wo.fecha).getMonth() + 1)
    )
    const months = Array.from(monthSet).sort((a, b) => b - a)

    setAvailableMonths(months)

    if (months.length > 0) {
      // Si es el año actual, seleccionar el mes actual
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      
      if (year === currentYear && months.includes(currentMonth)) {
        setSelectedMonth(currentMonth.toString())
        setIsCurrentPeriod(true)
      } else {
        // Seleccionar el mes más reciente
        setSelectedMonth(months[0].toString())
        setIsCurrentPeriod(false)
      }
    } else {
      setSelectedMonth('')
      setIsCurrentPeriod(false)
    }
  }, [workOrders])

  // Función para generar reporte mensual
  const generateMonthlyReport = useCallback((year: number, month: number): MonthlyReport => {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    console.log('🔍 generateMonthlyReport:', { year, month, startDate, endDate })
    console.log('🔍 Total trabajos disponibles:', workOrders.length)

    // Filtrar trabajos del mes
    const monthWorkOrders = workOrders.filter(wo => {
      // Parsear fecha correctamente (formato YYYY-MM-DD)
      const workDate = new Date(wo.fecha + 'T00:00:00')
      const isInRange = workDate >= startDate && workDate <= endDate
      console.log('🔍 Trabajo:', { 
        id: wo.id, 
        fecha: wo.fecha, 
        workDate, 
        startDate, 
        endDate, 
        isInRange 
      })
      return isInRange
    })

    console.log('🔍 Trabajos filtrados para el mes:', monthWorkOrders.length)

    // Calcular ingresos
    const totalIncome = monthWorkOrders.reduce((sum, wo) => sum + wo.costo, 0)

    // Filtrar gastos del taller del mes
    const monthGastos = gastosTaller.filter(g => {
      const gastoDate = new Date(g.fecha)
      return gastoDate >= startDate && gastoDate <= endDate
    })

    const gastosTallerTotal = monthGastos.reduce((sum, g) => sum + g.monto, 0)

    // Filtrar salarios del mes
    const monthSalarios = pagosSalarios.filter(p => {
      const salarioDate = new Date(p.fecha_pago)
      return salarioDate >= startDate && salarioDate <= endDate
    })

    const salariosTotal = monthSalarios.reduce((sum, p) => sum + p.monto_salario, 0)

    // Calcular gastos totales
    const totalExpenses = gastosTallerTotal + salariosTotal

    // Calcular ganancia neta
    const netProfit = totalIncome - totalExpenses

    return {
      month: getMonthName(month),
      year,
      totalIncome,
      totalExpenses,
      netProfit,
      workOrdersCount: monthWorkOrders.length,
      gastosTaller: gastosTallerTotal,
      salarios: salariosTotal
    }
  }, [workOrders, gastosTaller, pagosSalarios])

  // Función para obtener trabajos del mes seleccionado
  const getWorkOrdersForSelectedMonth = useCallback((): WorkOrder[] => {
    if (!selectedYear || !selectedMonth) {
      console.log('🔍 getWorkOrdersForSelectedMonth: No hay año o mes seleccionado')
      return []
    }

    const year = parseInt(selectedYear)
    const month = parseInt(selectedMonth)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    console.log('🔍 getWorkOrdersForSelectedMonth:', { selectedYear, selectedMonth, year, month, startDate, endDate })
    console.log('🔍 Total trabajos disponibles:', workOrders.length)

    const filtered = workOrders.filter(wo => {
      // Parsear fecha correctamente (formato YYYY-MM-DD)
      const workDate = new Date(wo.fecha + 'T00:00:00')
      const isInRange = workDate >= startDate && workDate <= endDate
      console.log('🔍 Filtrado trabajo:', { 
        id: wo.id, 
        fecha: wo.fecha, 
        workDate, 
        startDate, 
        endDate, 
        isInRange 
      })
      return isInRange
    })

    console.log('🔍 Trabajos filtrados:', filtered.length)
    return filtered
  }, [workOrders, selectedYear, selectedMonth])

  // Función para resetear al período actual
  const resetToCurrentPeriod = useCallback(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    setSelectedYear(currentYear.toString())
    setSelectedMonth(currentMonth.toString())
    setIsCurrentPeriod(true)
    setLastResetCheck(new Date())

    console.log('🔄 Reset al período actual:', { currentYear, currentMonth })
  }, [])

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [loadData])

  // Efecto para actualizar meses cuando cambia el año
  useEffect(() => {
    if (selectedYear) {
      updateAvailableMonths(parseInt(selectedYear))
    }
  }, [selectedYear, updateAvailableMonths])

  // Efecto para verificar reset automático cada hora
  useEffect(() => {
    const checkReset = () => {
      if (shouldAutoReset() && isCurrentPeriod) {
        console.log('🔄 Ejecutando reset automático mensual')
        resetToCurrentPeriod()
      }
    }

    // Verificar inmediatamente
    checkReset()

    // Verificar cada hora
    const interval = setInterval(checkReset, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [shouldAutoReset, isCurrentPeriod, resetToCurrentPeriod])

  // Generar reporte actual
  const currentReport = selectedYear && selectedMonth 
    ? generateMonthlyReport(parseInt(selectedYear), parseInt(selectedMonth))
    : null

  // Obtener trabajos del mes seleccionado
  const filteredWorkOrders = getWorkOrdersForSelectedMonth()

  // Debug logs
  console.log('🔍 RENDER DEBUG:', {
    selectedYear,
    selectedMonth,
    currentReport,
    filteredWorkOrders: filteredWorkOrders.length,
    workOrders: workOrders.length
  })

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Cargando datos de reportes...</p>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error al cargar datos</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes Financieros</h1>
          <p className="text-muted-foreground">
            Análisis de ingresos, gastos y ganancias por período
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={resetToCurrentPeriod}
            variant="outline"
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Ir al Período Actual
          </Button>
          
          <Button 
            onClick={loadData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Banner de reset automático */}
      {isCurrentPeriod && shouldAutoReset() && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Reset automático activo: Se actualizará al inicio del próximo mes
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selectores de período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seleccionar Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Año</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Mes</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen financiero */}
      {currentReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(currentReport.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentReport.workOrdersCount} trabajos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Gastos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(currentReport.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                Taller + Salarios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Ganancia Neta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(currentReport.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentReport.netProfit >= 0 ? 'Ganancia' : 'Pérdida'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Resumen del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Gastos Taller:</span>
                  <span>{formatCurrency(currentReport.gastosTaller)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Salarios:</span>
                  <span>{formatCurrency(currentReport.salarios)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sección de Mecánicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Mecánicos - {selectedMonth && selectedYear 
              ? `${getMonthName(parseInt(selectedMonth))}/${selectedYear}`
              : 'Período Seleccionado'
            }
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Resumen de salarios, comisiones y ganancias por mecánico en el mes seleccionado
          </p>
        </CardHeader>
        <CardContent>
          {mecanicos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mecánico</TableHead>
                    <TableHead>Total Salarial</TableHead>
                    <TableHead>Total Comisiones</TableHead>
                    <TableHead>Ganancia Base</TableHead>
                    <TableHead>Margen de Ganancia</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mecanicos.map((mecanico) => (
                    <TableRow key={mecanico.id}>
                      <TableCell className="font-medium">
                        {mecanico.nombre}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(0)} {/* TODO: Calcular salarios del mes */}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(0)} {/* TODO: Calcular comisiones del mes */}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(0)} {/* TODO: Calcular ganancia base */}
                      </TableCell>
                      <TableCell>
                        0.0% {/* TODO: Calcular margen */}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">No hay mecánicos registrados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de trabajos del mes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Trabajos del Mes - {selectedMonth && selectedYear 
              ? `${getMonthName(parseInt(selectedMonth))}/${selectedYear}`
              : 'Período Seleccionado'
            }
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Lista completa de todos los trabajos realizados en el mes seleccionado
          </p>
        </CardHeader>
        <CardContent>
          {filteredWorkOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Mecánicos</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((workOrder) => (
                    <TableRow key={workOrder.id}>
                      <TableCell className="font-medium">
                        {workOrder.cliente_nombre}
                      </TableCell>
                      <TableCell>
                        {workOrder.matricula_carro}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {workOrder.descripcion}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {workOrder.mecanicos_nombres.map((nombre, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {nombre}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(workOrder.fecha)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(workOrder.costo)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          Activo
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No hay trabajos en este período
              </h3>
              <p className="text-muted-foreground">
                No se encontraron trabajos para {selectedMonth && selectedYear 
                  ? `${getMonthName(parseInt(selectedMonth))} ${selectedYear}`
                  : 'el período seleccionado'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Trabajos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredWorkOrders.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingreso Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredWorkOrders.length > 0 
                ? formatCurrency(filteredWorkOrders.reduce((sum, wo) => sum + wo.costo, 0) / filteredWorkOrders.length)
                : formatCurrency(0)
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gasto Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(0)} {/* TODO: Calcular gastos promedio */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              0.0% {/* TODO: Calcular margen promedio */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
