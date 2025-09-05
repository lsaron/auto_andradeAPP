"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { API_CONFIG, buildApiUrl } from "@/app/lib/api-config"
import { mecanicosApi } from "@/lib/api-client"
import type { Mechanic } from "@/lib/types"

// Función helper para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Función helper para calcular porcentaje de cambio
const calculatePercentageChange = (current: number, previous: number): { percentage: number; isIncrease: boolean } => {
  if (previous === 0) {
    return { percentage: current > 0 ? 100 : 0, isIncrease: current > 0 }
  }
  const percentage = ((current - previous) / previous) * 100
  return { percentage: Math.abs(percentage), isIncrease: current > previous }
}

// Componente de Select personalizado con animación
const AnimatedSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  className 
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setIsOpen(!isOpen)
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 200)
  }

  const handleSelect = (value: string) => {
    onChange(value)
    setIsAnimating(true)
    setIsOpen(false)
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 200)
  }

  // Cerrar select cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsAnimating(true)
          setIsOpen(false)
          setTimeout(() => {
            setIsAnimating(false)
          }, 200)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full h-8 text-xs px-2 py-1 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${
          isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="text-left">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div 
          className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden ${
            isAnimating ? 'animate-in slide-in-from-top-2 duration-200' : ''
          }`}
          style={{
            animation: isAnimating ? 'slideDown 0.2s ease-out' : undefined
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-100 transition-colors duration-150 ${
                option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

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
  detalles_gastos?: Array<{
    id: number
    id_trabajo: number
    descripcion: string
    monto: number
    monto_cobrado: number
  }>
}

interface GastoTaller {
  id: number
  descripcion: string
  monto: number
  fecha_gasto: string
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

interface ComisionMecanico {
  id: number
  id_trabajo: number
  id_mecanico: number
  ganancia_trabajo: number
  porcentaje_comisi: number
  monto_comision: number
  fecha_calculo: string
  mes_reporte: number
  estado_comision: string
  quincena: number
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
  gastosRepuestos: number
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
  const [comisionesMecanicos, setComisionesMecanicos] = useState<ComisionMecanico[]>([])
  const [mecanicos, setMecanicos] = useState<Mechanic[]>([])
  const [comisionesPorMecanico, setComisionesPorMecanico] = useState<{[key: string]: number}>({})
  
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
  
  // Estados para el modal de detalles del mecánico
  const [isMechanicDetailModalOpen, setIsMechanicDetailModalOpen] = useState(false)
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)

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

  // Función para calcular salarios del mecánico en el mes seleccionado
  const calcularSalariosMecanico = useCallback((mecanicoId: string) => {
    if (!selectedYear || !selectedMonth) return 0
    
    console.log('🔍 DEBUG Salarios - Mecánico ID:', mecanicoId, 'Tipo:', typeof mecanicoId)
    console.log('🔍 DEBUG Salarios - Año:', selectedYear, 'Mes:', selectedMonth)
    console.log('🔍 DEBUG Salarios - Pagos disponibles:', pagosSalarios)
    
    const salariosDelMes = pagosSalarios.filter(pago => {
      const fechaPago = new Date(pago.fecha_pago)
      const añoPago = fechaPago.getFullYear()
      const mesPago = fechaPago.getMonth() + 1
      
      const matches = añoPago === parseInt(selectedYear) && 
             mesPago === parseInt(selectedMonth) &&
             pago.id_mecanico === parseInt(mecanicoId)
      
      console.log('🔍 DEBUG Pago:', pago, 'Fecha:', fechaPago, 'Año:', añoPago, 'Mes:', mesPago, 'ID Mecánico:', pago.id_mecanico, 'Matches:', matches)
      
      return matches
    })
    
    console.log('🔍 DEBUG Salarios filtrados:', salariosDelMes)
    
    const total = salariosDelMes.reduce((total, pago) => total + Number(pago.monto_salario || 0), 0)
    console.log('🔍 DEBUG Total salarios:', total)
    
    return total
  }, [pagosSalarios, selectedYear, selectedMonth])

  // Función para cargar comisiones de todos los mecánicos
  const cargarComisionesMecanicos = useCallback(async () => {
    if (!selectedYear || !selectedMonth || mecanicos.length === 0) return
    
    try {
      const comisionesMap: {[key: string]: number} = {}
      
      // Cargar estadísticas de cada mecánico (igual que mechanics-section)
      for (const mecanico of mecanicos) {
        try {
          const response = await fetch(buildApiUrl(`/mecanicos/${mecanico.id}/estadisticas`))
          if (!response.ok) {
            console.error(`Error al obtener estadísticas del mecánico ${mecanico.id}:`, response.statusText)
            comisionesMap[mecanico.id] = 0
            continue
          }
          
          const statsData = await response.json()
          console.log(`🔍 Estadísticas del mecánico ${mecanico.id}:`, statsData)
          
          // Usar las comisiones del mes que ya vienen calculadas del backend
          const comisionesDelMes = parseFloat(statsData.comisiones_mes?.toString() || '0')
          
          comisionesMap[mecanico.id] = comisionesDelMes
        } catch (error) {
          console.error(`Error al cargar estadísticas del mecánico ${mecanico.id}:`, error)
          comisionesMap[mecanico.id] = 0
        }
      }
      
      console.log('🔍 Comisiones cargadas:', comisionesMap)
      setComisionesPorMecanico(comisionesMap)
    } catch (error) {
      console.error('Error al cargar comisiones de mecánicos:', error)
    }
  }, [mecanicos, selectedYear, selectedMonth])

  // Función para obtener comisiones del mecánico desde el estado
  const calcularComisionesMecanico = useCallback((mecanicoId: string) => {
    return comisionesPorMecanico[mecanicoId] || 0
  }, [comisionesPorMecanico])

  // Función para calcular ganancia base del mecánico en el mes seleccionado
  const calcularGananciaBaseMecanico = useCallback((mecanicoId: string) => {
    if (!selectedYear || !selectedMonth) return 0
    
    const trabajosDelMes = workOrders.filter(trabajo => {
      const fechaTrabajo = new Date(trabajo.fecha)
      const añoTrabajo = fechaTrabajo.getFullYear()
      const mesTrabajo = fechaTrabajo.getMonth() + 1
      
      return añoTrabajo === parseInt(selectedYear) && 
             mesTrabajo === parseInt(selectedMonth) &&
             trabajo.mecanicos_ids.includes(parseInt(mecanicoId))
    })
    
    // Sumar la ganancia base de todos los trabajos del mecánico
    return trabajosDelMes.reduce((total, trabajo) => {
      const gananciaBase = trabajo.mano_obra || 0
      return total + gananciaBase
    }, 0)
  }, [workOrders, selectedYear, selectedMonth])

  // Función para abrir el modal de detalles del mecánico
  const handleViewMechanicDetails = useCallback((mecanico: Mechanic) => {
    console.log('🔍 Abriendo detalles para mecánico:', mecanico)
    console.log('🔍 Todos los trabajos disponibles:', workOrders)
    console.log('🔍 Año/Mes actual:', selectedYear, selectedMonth)
    setSelectedMechanic(mecanico)
    setIsMechanicDetailModalOpen(true)
  }, [workOrders, selectedYear, selectedMonth])

  // Función para cargar datos del backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Cargando datos del backend...')

      // Cargar todos los datos en paralelo
      console.log('🔍 Intentando cargar mecánicos con mecanicosApi.getAll()...')
      const [workOrdersRes, gastosRes, salariosRes, detallesGastosRes, mecanicosData] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TRABAJOS)),
        fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.GASTOS_TALLER)}?estado=PAGADO`),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PAGOS_SALARIOS)),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DETALLES_GASTOS)),
        mecanicosApi.getAll().catch(err => {
          console.error('❌ Error al cargar mecánicos:', err)
          return []
        })
      ])

      if (!workOrdersRes.ok) throw new Error(`Error al cargar trabajos: ${workOrdersRes.status}`)
      if (!gastosRes.ok) throw new Error(`Error al cargar gastos: ${gastosRes.status}`)
      if (!salariosRes.ok) throw new Error(`Error al cargar salarios: ${salariosRes.status}`)
      if (!detallesGastosRes.ok) throw new Error(`Error al cargar detalles de gastos: ${detallesGastosRes.status}`)

      const [workOrdersData, gastosData, salariosData, detallesGastosData] = await Promise.all([
        workOrdersRes.json(),
        gastosRes.json(),
        salariosRes.json(),
        detallesGastosRes.json()
      ])

      console.log('✅ Datos cargados:', {
        trabajos: workOrdersData.length,
        gastos: gastosData.length,
        salarios: salariosData.length,
        detallesGastos: detallesGastosData.length,
        mecanicos: mecanicosData.length
      })

      // Mapear los datos de mecánicos a la interfaz Mechanic
      const mappedMechanics = mecanicosData.map((mecanico: any) => ({
        id: mecanico.id.toString(),
        name: mecanico.nombre,
        mechanic_id: `MC-${mecanico.id}`,
        jobs_completed: 0,
        total_commission: 0,
        total_profit: 0,
        hire_date: mecanico.fecha_contratacion || new Date().toISOString(),
        created_at: mecanico.created_at || new Date().toISOString(),
        updated_at: mecanico.updated_at || new Date().toISOString()
      }))

      console.log('🔍 Mecánicos mapeados:', mappedMechanics)
      console.log('🔍 DEBUG: Datos originales de mecánicos:', mecanicosData)

      // Procesar trabajos con detalles de gastos
      const workOrdersWithDetails = workOrdersData.map((trabajo: any) => ({
        ...trabajo,
        detalles_gastos: detallesGastosData.filter((detalle: any) => detalle.id_trabajo === trabajo.id)
      }))

      setWorkOrders(workOrdersWithDetails)
      setGastosTaller(gastosData)
      setPagosSalarios(salariosData)
      setComisionesMecanicos([]) // Inicializar como lista vacía, se calcularán dinámicamente
      setMecanicos(mappedMechanics)

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
        // Actualizar meses para el año actual
        setTimeout(() => updateAvailableMonths(currentYear), 0)
      } else {
        // Seleccionar el año más reciente por defecto
        setSelectedYear(years[0].toString())
        // Actualizar meses para el año seleccionado
        setTimeout(() => updateAvailableMonths(years[0]), 0)
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

  // Función para generar reporte del mes anterior
  const generatePreviousMonthReport = useCallback((year: number, month: number): MonthlyReport | null => {
    // Calcular el mes anterior
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    
    const startDate = new Date(prevYear, prevMonth - 1, 1)
    const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59)

    // Filtrar trabajos del mes anterior
    const prevMonthWorkOrders = workOrders.filter(wo => {
      const workDate = new Date(wo.fecha + 'T00:00:00')
      return workDate >= startDate && workDate <= endDate
    })

    // Calcular ingresos del mes anterior
    const prevTotalIncome = prevMonthWorkOrders.reduce((sum, wo) => sum + wo.costo, 0)

    // Filtrar gastos del taller del mes anterior
    const prevMonthGastos = gastosTaller.filter(g => {
      const gastoDate = new Date(g.fecha_gasto)
      return gastoDate >= startDate && gastoDate <= endDate
    })
    const prevGastosTallerTotal = prevMonthGastos.reduce((sum, g) => sum + Number(g.monto), 0)

    // Filtrar salarios del mes anterior
    const prevMonthSalarios = pagosSalarios.filter(p => {
      const salarioDate = new Date(p.fecha_pago)
      return salarioDate >= startDate && salarioDate <= endDate
    })
    const prevSalariosTotal = prevMonthSalarios.reduce((sum, p) => sum + Number(p.monto_salario), 0)

    // Calcular gastos de repuestos del mes anterior
    const prevGastosRepuestosTotal = prevMonthWorkOrders.reduce((sum, wo) => {
      // Sumar todos los detalles de gastos de este trabajo
      const detallesGastos = workOrders
        .filter(w => w.id === wo.id)
        .flatMap(w => w.detalles_gastos || [])
        .reduce((detalleSum, detalle) => detalleSum + (detalle.monto || 0), 0)
      
      return sum + detallesGastos
    }, 0)

    // Calcular ganancia neta del mes anterior
    const prevTotalManoObra = prevMonthWorkOrders.reduce((sum, wo) => sum + (wo.mano_obra || 0), 0)
    const prevTotalMarkup = prevMonthWorkOrders.reduce((sum, wo) => sum + (wo.markup_repuestos || 0), 0)
    const prevNetProfit = prevTotalManoObra + prevTotalMarkup

    return {
      month: getMonthName(prevMonth),
      year: prevYear,
      totalIncome: prevTotalIncome,
      totalExpenses: prevGastosTallerTotal + prevSalariosTotal,
      netProfit: prevNetProfit,
      workOrdersCount: prevMonthWorkOrders.length,
      gastosTaller: prevGastosTallerTotal,
      salarios: prevSalariosTotal,
      gastosRepuestos: prevGastosRepuestosTotal
    }
  }, [workOrders, gastosTaller, pagosSalarios])

  // Función para calcular comisiones totales del mes
  const calcularComisionesTotales = useCallback((): number => {
    if (!selectedYear || !selectedMonth) return 0
    
    // Sumar las comisiones reales de todos los mecánicos (ya filtradas por el backend)
    return Object.values(comisionesPorMecanico).reduce((total, comision) => total + comision, 0)
  }, [comisionesPorMecanico, selectedYear, selectedMonth])

  // Función para calcular comisiones totales del mes anterior
  const calcularComisionesTotalesAnterior = useCallback((): number => {
    if (!selectedYear || !selectedMonth) return 0

    const currentMonth = parseInt(selectedMonth)
    const currentYear = parseInt(selectedYear)
    
    let previousMonth = currentMonth - 1
    let previousYear = currentYear
    
    if (previousMonth === 0) {
      previousMonth = 12
      previousYear = currentYear - 1
    }

    // Para el mes anterior, usar el cálculo basado en trabajos (ya que no tenemos datos históricos de comisiones)
    return workOrders
      .filter(wo => {
        const fecha = new Date(wo.fecha)
        const año = fecha.getFullYear()
        const mes = fecha.getMonth() + 1
        return año === previousYear && mes === previousMonth
      })
      .reduce((total, trabajo) => {
        // Calcular comisión como 2% de la mano de obra
        const comisionTrabajo = (trabajo.mano_obra || 0) * 0.02
        return total + comisionTrabajo
      }, 0)
  }, [workOrders, selectedYear, selectedMonth])

  // Función para calcular margen de rentabilidad
  const calcularMargenRentabilidad = useCallback((ingresos: number, gastos: number): number => {
    if (gastos === 0) return ingresos > 0 ? 100 : 0
    return (ingresos / gastos) * 100
  }, [])

  // Función para generar datos de los últimos 6 meses para gráficos
  const generarDatosHistoricos = useCallback(() => {
    const datos = []
    const fechaActual = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1)
      const año = fecha.getFullYear()
      const mes = fecha.getMonth() + 1
      
      // Filtrar trabajos del mes
      const trabajosMes = workOrders.filter(wo => {
        const fechaTrabajo = new Date(wo.fecha)
        const añoTrabajo = fechaTrabajo.getFullYear()
        const mesTrabajo = fechaTrabajo.getMonth() + 1
        return añoTrabajo === año && mesTrabajo === mes
      })
      
      // Filtrar gastos del mes (solo PAGADOS)
      const gastosMes = gastosTaller.filter(g => {
        const fechaGasto = new Date(g.fecha_gasto)
        const añoGasto = fechaGasto.getFullYear()
        const mesGasto = fechaGasto.getMonth() + 1
        return añoGasto === año && mesGasto === mes && (g as any).estado === 'PAGADO'
      })
      
      // Filtrar salarios del mes (solo PAGADOS)
      const salariosMes = pagosSalarios.filter(p => {
        const fechaPago = new Date(p.fecha_pago)
        const añoPago = fechaPago.getFullYear()
        const mesPago = fechaPago.getMonth() + 1
        return añoPago === año && mesPago === mes && (p as any).estado === 'PAGADO'
      })
      
      // Calcular totales
      const ingresos = trabajosMes.reduce((sum, wo) => sum + (wo.mano_obra || 0) + (wo.markup_repuestos || 0), 0)
      const gastosTallerTotal = gastosMes.reduce((sum, g) => sum + Number(g.monto || 0), 0)
      const salariosTotal = salariosMes.reduce((sum, p) => sum + Number(p.monto_salario || 0), 0)
      
      // Para comisiones, usar las comisiones reales aprobadas del mes actual
      let comisionesTotal = 0
      if (mes === parseInt(selectedMonth) && año === parseInt(selectedYear)) {
        // Para el mes actual, usar las comisiones reales aprobadas
        comisionesTotal = Object.values(comisionesPorMecanico).reduce((total, comision) => total + comision, 0)
      } else {
        // Para meses anteriores, usar el cálculo basado en trabajos (ya que no tenemos datos históricos)
        comisionesTotal = trabajosMes.reduce((sum, wo) => sum + (wo.mano_obra || 0) * 0.02, 0)
      }
      
      const gastos = gastosTallerTotal + salariosTotal + comisionesTotal
      
      // Las ganancias netas son la suma de mano_obra + markup_repuestos (no se restan comisiones)
      const ganancias = trabajosMes.reduce((sum, wo) => sum + (wo.mano_obra || 0) + (wo.markup_repuestos || 0), 0)
      
      // Debug para septiembre
      if (mes === 9 && año === 2025) {
        console.log('🔍 DEBUG Septiembre 2025:', {
          trabajosMes: trabajosMes.length,
          ingresos,
          gastosTallerTotal,
          salariosTotal,
          comisionesTotal,
          gastos,
          ganancias
        })
      }
      
      datos.push({
        mes: getMonthName(mes),
        año: año,
        ingresos: ingresos,
        gastos: gastos,
        ganancias: ganancias,
        gastosTaller: gastosTallerTotal,
        salarios: salariosTotal,
        comisiones: comisionesTotal
      })
    }
    
    console.log('📊 Datos históricos para gráfico:', datos)
    return datos
  }, [workOrders, gastosTaller, pagosSalarios, comisionesPorMecanico, selectedYear, selectedMonth])


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
      const gastoDate = new Date(g.fecha_gasto)
      return gastoDate >= startDate && gastoDate <= endDate
    })

    const gastosTallerTotal = monthGastos.reduce((sum, g) => sum + Number(g.monto), 0)
    
    console.log('🔍 DEBUG Gastos Taller:', {
      totalGastosTaller: gastosTaller.length,
      monthGastos: monthGastos.length,
      gastosTallerTotal,
      monthGastosDetails: monthGastos.map(g => ({
        id: g.id,
        descripcion: g.descripcion,
        monto: g.monto,
        fecha_gasto: g.fecha_gasto
      }))
    })

    // Filtrar salarios del mes
    const monthSalarios = pagosSalarios.filter(p => {
      const salarioDate = new Date(p.fecha_pago)
      return salarioDate >= startDate && salarioDate <= endDate
    })

    const salariosTotal = monthSalarios.reduce((sum, p) => sum + Number(p.monto_salario), 0)
    
    console.log('🔍 DEBUG Salarios:', {
      totalSalarios: pagosSalarios.length,
      monthSalarios: monthSalarios.length,
      salariosTotal,
      monthSalariosDetails: monthSalarios.map(p => ({
        id: p.id,
        mecanico_nombre: p.mecanico_nombre,
        monto_salario: p.monto_salario,
        fecha_pago: p.fecha_pago
      }))
    })

    // Calcular gastos de repuestos (suma de todos los detalles de gastos del mes)
    const gastosRepuestosTotal = monthWorkOrders.reduce((sum, wo) => {
      // Sumar todos los detalles de gastos de este trabajo
      const detallesGastos = workOrders
        .filter(w => w.id === wo.id)
        .flatMap(w => w.detalles_gastos || [])
        .reduce((detalleSum, detalle) => detalleSum + (detalle.monto || 0), 0)
      
      return sum + detallesGastos
    }, 0)

    // Calcular comisiones del mes (solo aprobadas)
    const comisionesDelMes = Object.values(comisionesPorMecanico).reduce((total, comision) => total + comision, 0)
    
    // Calcular gastos totales (taller + salarios + comisiones aprobadas)
    const totalExpenses = gastosTallerTotal + salariosTotal + comisionesDelMes

    // Calcular ganancia neta (mano de obra + markup)
    const totalManoObra = monthWorkOrders.reduce((sum, wo) => sum + (wo.mano_obra || 0), 0)
    const totalMarkup = monthWorkOrders.reduce((sum, wo) => sum + (wo.markup_repuestos || 0), 0)
    const netProfit = totalManoObra + totalMarkup

    return {
      month: getMonthName(month),
      year,
      totalIncome,
      totalExpenses,
      netProfit,
      workOrdersCount: monthWorkOrders.length,
      gastosTaller: gastosTallerTotal,
      salarios: salariosTotal,
      gastosRepuestos: gastosRepuestosTotal
    }
  }, [workOrders, gastosTaller, pagosSalarios, comisionesPorMecanico])

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

  // Efecto para cargar comisiones cuando cambien los mecánicos o el período
  useEffect(() => {
    if (mecanicos.length > 0 && selectedYear && selectedMonth) {
      cargarComisionesMecanicos()
    }
  }, [mecanicos, selectedYear, selectedMonth, cargarComisionesMecanicos])

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

  // Generar reporte del mes anterior
  const previousReport = selectedYear && selectedMonth
    ? generatePreviousMonthReport(parseInt(selectedYear), parseInt(selectedMonth))
    : null

  // Función para generar datos del mes actual para gráfico circular
  const generarDatosGastosActuales = useCallback(() => {
    if (!currentReport) return []
    
    const comisionesActuales = calcularComisionesTotales()
    
    return [
      { name: 'Salarios', value: currentReport.salarios, color: '#3B82F6' },
      { name: 'Gastos Taller', value: currentReport.gastosTaller, color: '#EF4444' },
      { name: 'Comisiones', value: comisionesActuales, color: '#F59E0B' }
    ].filter(item => item.value > 0)
  }, [currentReport, calcularComisionesTotales])


  // Obtener trabajos del mes seleccionado
  const filteredWorkOrders = getWorkOrdersForSelectedMonth()

  // Función para calcular gasto promedio por trabajo
  const calcularGastoPromedio = useCallback(() => {
    if (filteredWorkOrders.length === 0) return 0
    
    const gastosTaller = currentReport?.gastosTaller || 0
    const salarios = currentReport?.salarios || 0
    const comisiones = calcularComisionesTotales()
    const gastosPorTrabajo = (gastosTaller + salarios + comisiones) / filteredWorkOrders.length
    
    return gastosPorTrabajo
  }, [filteredWorkOrders, currentReport, calcularComisionesTotales])

  // Función para calcular margen promedio
  const calcularMargenPromedio = useCallback(() => {
    if (filteredWorkOrders.length === 0) return 0
    
    const ingresoTotal = filteredWorkOrders.reduce((sum, wo) => sum + wo.costo, 0)
    const gastoTotal = calcularGastoPromedio() * filteredWorkOrders.length
    
    if (gastoTotal === 0) return ingresoTotal > 0 ? 100 : 0
    
    return ((ingresoTotal - gastoTotal) / ingresoTotal) * 100
  }, [filteredWorkOrders, calcularGastoPromedio])

  // Debug logs
  console.log('🔍 RENDER DEBUG:', {
    selectedYear,
    selectedMonth,
    currentReport,
    filteredWorkOrders: filteredWorkOrders.length,
    workOrders: workOrders.length,
    mecanicosLength: mecanicos.length,
    mecanicos: mecanicos
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
        
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          {/* Selectores de fecha compactos */}
          <div className="flex gap-2 items-center">
            <AnimatedSelect
              value={selectedYear}
              onChange={setSelectedYear}
              options={availableYears.map(year => ({
                value: year.toString(),
                label: year.toString()
              }))}
              placeholder="Año"
              className="w-20"
            />
            
            <AnimatedSelect
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={availableMonths.map(month => ({
                value: month.toString(),
                label: getMonthName(month)
              }))}
              placeholder="Mes"
              className="w-24"
            />
          </div>
          
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


      {/* Resumen financiero */}
      {currentReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
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
              {previousReport && (
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-xs">
                    {(() => {
                      const change = calculatePercentageChange(currentReport.totalExpenses, previousReport.totalExpenses)
                      return (
                        <>
                          <span className={change.isIncrease ? "text-red-500" : "text-green-500"}>
                            {change.isIncrease ? "↗" : "↘"}
                          </span>
                          <span className={change.isIncrease ? "text-red-500" : "text-green-500"}>
                            {change.percentage.toFixed(1)}%
                          </span>
                          <span className="text-muted-foreground">
                            vs {previousReport.month}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(previousReport.totalExpenses)} anterior
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Repuestos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(currentReport.gastosRepuestos || 0)}
              </div>
              {previousReport && (
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-xs">
                    {(() => {
                      const change = calculatePercentageChange(currentReport.gastosRepuestos, previousReport.gastosRepuestos)
                      return (
                        <>
                          <span className={change.isIncrease ? "text-red-500" : "text-green-500"}>
                            {change.isIncrease ? "↗" : "↘"}
                          </span>
                          <span className={change.isIncrease ? "text-red-500" : "text-green-500"}>
                            {change.percentage.toFixed(1)}%
                          </span>
                          <span className="text-muted-foreground">
                            vs {previousReport.month}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(previousReport.gastosRepuestos)} anterior
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Ganancia Neta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(currentReport.netProfit)}
              </div>
              {previousReport && (
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-xs">
                    {(() => {
                      const change = calculatePercentageChange(currentReport.netProfit, previousReport.netProfit)
                      return (
                        <>
                          <span className={change.isIncrease ? "text-green-500" : "text-red-500"}>
                            {change.isIncrease ? "↗" : "↘"}
                          </span>
                          <span className={change.isIncrease ? "text-green-500" : "text-red-500"}>
                            {change.percentage.toFixed(1)}%
                          </span>
                          <span className="text-muted-foreground">
                            vs {previousReport.month}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(previousReport.netProfit)} anterior
                  </div>
                </div>
              )}
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
                    <TableHead>Ganancias Generadas</TableHead>
                    <TableHead>Margen de Ganancia</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mecanicos.map((mecanico) => (
                    <TableRow key={mecanico.id}>
                      <TableCell className="font-medium">
                        {mecanico.name}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(calcularSalariosMecanico(mecanico.id))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(calcularComisionesMecanico(mecanico.id))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(calcularGananciaBaseMecanico(mecanico.id))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const gananciaBase = calcularGananciaBaseMecanico(mecanico.id)
                          const comisiones = calcularComisionesMecanico(mecanico.id)
                          const salarios = calcularSalariosMecanico(mecanico.id)
                          const costoTotal = salarios + comisiones // Lo que cuesta el mecánico
                          
                          // Si no hay costo total, no se puede calcular margen
                          if (costoTotal === 0) {
                            return gananciaBase > 0 ? "∞%" : "0.0%"
                          }
                          
                          const margen = (gananciaBase / costoTotal) * 100
                          return `${margen.toFixed(1)}%`
                        })()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewMechanicDetails(mecanico)}
                        >
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

      {/* Comparación Mensual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Comparación Mensual
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Análisis comparativo entre el mes actual y el mes anterior
          </p>
        </CardHeader>
        <CardContent>
          {currentReport && previousReport ? (
            <div className="space-y-6">
              {/* Resumen Ejecutivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-purple-700 mb-2">
                    {previousReport.month} {previousReport.year}
                  </h3>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(previousReport.netProfit)}
                  </div>
                  <div className="text-sm text-gray-600">Ganancias</div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">
                    {getMonthName(parseInt(selectedMonth || '1'))} {selectedYear}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(currentReport.netProfit)}
                  </div>
                  <div className="text-sm text-gray-600">Ganancias</div>
                </div>
              </div>

              {/* Tabla de Comparación Detallada */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Métrica</th>
                      <th className="text-center py-3 px-4 font-semibold text-purple-700">
                        {previousReport.month} {previousReport.year}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-700">
                        {getMonthName(parseInt(selectedMonth || '1'))} {selectedYear}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Cambio</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Ingresos Totales */}
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">Ingresos Totales</td>
                      <td className="py-3 px-4 text-center font-semibold text-purple-600">
                        {formatCurrency(previousReport.totalIncome)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600">
                        {formatCurrency(currentReport.totalIncome)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = currentReport.totalIncome - previousReport.totalIncome
                          const porcentaje = previousReport.totalIncome > 0 
                            ? (cambio / previousReport.totalIncome) * 100 
                            : 0
                          return (
                            <span className={`font-medium ${cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {cambio >= 0 ? '+' : ''}{formatCurrency(cambio)}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = currentReport.totalIncome - previousReport.totalIncome
                          const porcentaje = previousReport.totalIncome > 0 
                            ? (cambio / previousReport.totalIncome) * 100 
                            : 0
                          return (
                            <div className="flex items-center justify-center gap-1">
                              {cambio >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm font-medium ${cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(porcentaje).toFixed(1)}%
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                    </tr>

                    {/* Gastos Totales */}
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">Gastos Totales</td>
                      <td className="py-3 px-4 text-center font-semibold text-purple-600">
                        {formatCurrency(previousReport.totalExpenses)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600">
                        {formatCurrency(currentReport.totalExpenses)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = currentReport.totalExpenses - previousReport.totalExpenses
                          return (
                            <span className={`font-medium ${cambio <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {cambio >= 0 ? '+' : ''}{formatCurrency(cambio)}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = currentReport.totalExpenses - previousReport.totalExpenses
                          const porcentaje = previousReport.totalExpenses > 0 
                            ? (cambio / previousReport.totalExpenses) * 100 
                            : 0
                          return (
                            <div className="flex items-center justify-center gap-1">
                              {cambio <= 0 ? (
                                <TrendingDown className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm font-medium ${cambio <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(porcentaje).toFixed(1)}%
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                    </tr>

                    {/* Repuestos */}
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">Repuestos</td>
                      <td className="py-3 px-4 text-center font-semibold text-purple-600">
                        {formatCurrency(previousReport.gastosRepuestos)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600">
                        {formatCurrency(currentReport.gastosRepuestos)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = currentReport.gastosRepuestos - previousReport.gastosRepuestos
                          return (
                            <span className={`font-medium ${cambio <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {cambio >= 0 ? '+' : ''}{formatCurrency(cambio)}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = currentReport.gastosRepuestos - previousReport.gastosRepuestos
                          const porcentaje = previousReport.gastosRepuestos > 0 
                            ? (cambio / previousReport.gastosRepuestos) * 100 
                            : 0
                          return (
                            <div className="flex items-center justify-center gap-1">
                              {cambio <= 0 ? (
                                <TrendingDown className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm font-medium ${cambio <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(porcentaje).toFixed(1)}%
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                    </tr>

                    {/* Comisiones Totales */}
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">Comisiones Totales</td>
                      <td className="py-3 px-4 text-center font-semibold text-purple-600">
                        {formatCurrency(calcularComisionesTotalesAnterior())}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600">
                        {formatCurrency(calcularComisionesTotales())}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = calcularComisionesTotales() - calcularComisionesTotalesAnterior()
                          return (
                            <span className={`font-medium ${cambio >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {cambio >= 0 ? '+' : ''}{formatCurrency(cambio)}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = calcularComisionesTotales() - calcularComisionesTotalesAnterior()
                          const porcentaje = calcularComisionesTotalesAnterior() > 0 
                            ? (cambio / calcularComisionesTotalesAnterior()) * 100 
                            : 0
                          return (
                            <div className="flex items-center justify-center gap-1">
                              {cambio >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-red-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-green-500" />
                              )}
                              <span className={`text-sm font-medium ${cambio >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {Math.abs(porcentaje).toFixed(1)}%
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                    </tr>

                    {/* Ganancias */}
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">Ganancias</td>
                      <td className="py-3 px-4 text-center font-semibold text-purple-600">
                        {formatCurrency(previousReport.netProfit)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600">
                        {formatCurrency(currentReport.netProfit)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = currentReport.netProfit - previousReport.netProfit
                          return (
                            <span className={`font-medium ${cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {cambio >= 0 ? '+' : ''}{formatCurrency(cambio)}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const cambio = currentReport.netProfit - previousReport.netProfit
                          const porcentaje = previousReport.netProfit > 0 
                            ? (cambio / previousReport.netProfit) * 100 
                            : 0
                          return (
                            <div className="flex items-center justify-center gap-1">
                              {cambio >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm font-medium ${cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(porcentaje).toFixed(1)}%
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                    </tr>

                    {/* Margen de Rentabilidad */}
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">Margen de Rentabilidad</td>
                      <td className="py-3 px-4 text-center font-semibold text-purple-600">
                        {calcularMargenRentabilidad(previousReport.netProfit, previousReport.totalExpenses).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600">
                        {calcularMargenRentabilidad(currentReport.netProfit, currentReport.totalExpenses).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const margenActual = calcularMargenRentabilidad(currentReport.netProfit, currentReport.totalExpenses)
                          const margenAnterior = calcularMargenRentabilidad(previousReport.netProfit, previousReport.totalExpenses)
                          const cambio = margenActual - margenAnterior
                          return (
                            <span className={`font-medium ${cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {cambio >= 0 ? '+' : ''}{cambio.toFixed(1)}%
                            </span>
                          )
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const margenActual = calcularMargenRentabilidad(currentReport.netProfit, currentReport.totalExpenses)
                          const margenAnterior = calcularMargenRentabilidad(previousReport.netProfit, previousReport.totalExpenses)
                          const cambio = margenActual - margenAnterior
                          return (
                            <div className="flex items-center justify-center gap-1">
                              {cambio >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm font-medium ${cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(cambio).toFixed(1)}%
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">No hay datos suficientes para la comparación</p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((workOrder, index) => (
                    <TableRow key={workOrder.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {workOrder.cliente_nombre}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                          {workOrder.matricula_carro}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-700">
                        {workOrder.descripcion}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {workOrder.mecanicos_nombres && workOrder.mecanicos_nombres.length > 0 ? (
                            workOrder.mecanicos_nombres.map((nombre, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              >
                                {nombre}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin asignar</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(workOrder.fecha)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(workOrder.costo)}
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

      {/* Gráficos de Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Gastos vs Ganancias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Gastos vs Ganancias (Últimos 6 Meses)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Evolución de gastos totales y ganancias netas
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={generarDatosHistoricos()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const label = name === 'gastos' ? 'Gastos' : 'Ganancias'
                      return [formatCurrency(Number(value)), label]
                    }}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Bar 
                    dataKey="gastos" 
                    fill="#EF4444" 
                    name="Gastos"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="ganancias" 
                    fill="#10B981" 
                    name="Ganancias"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Circular - Distribución de Gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Distribución de Gastos del Mes
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Desglose de gastos totales del mes actual
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={generarDatosGastosActuales()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {generarDatosGastosActuales().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Monto']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontSize: '12px' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(calcularGastoPromedio())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {calcularMargenPromedio().toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalles del Mecánico */}
      {isMechanicDetailModalOpen && selectedMechanic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Detalles de {selectedMechanic.name}
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsMechanicDetailModalOpen(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Total Salarial</h3>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(calcularSalariosMecanico(selectedMechanic.id))}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Total Comisiones</h3>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(calcularComisionesMecanico(selectedMechanic.id))}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Ganancia Base|</h3>
                  <p className="text-lg font-semibold text-purple-600">
                    {formatCurrency(calcularGananciaBaseMecanico(selectedMechanic.id))}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Margen de Ganancia</h3>
                  <p className="text-lg font-semibold text-orange-600">
                    {(() => {
                      const gananciaBase = calcularGananciaBaseMecanico(selectedMechanic.id)
                      const comisiones = calcularComisionesMecanico(selectedMechanic.id)
                      const salarios = calcularSalariosMecanico(selectedMechanic.id)
                      const costoTotal = salarios + comisiones // Lo que cuesta el mecánico
                      
                      // Si no hay costo total, no se puede calcular margen
                      if (costoTotal === 0) {
                        return gananciaBase > 0 ? "∞%" : "0.0%"
                      }
                      
                      const margen = (gananciaBase / costoTotal) * 100
                      return `${margen.toFixed(1)}%`
                    })()}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Trabajos del Mes</h3>
                {(() => {
                  console.log('🔍 DEBUG MODAL - Todos los trabajos:', workOrders)
                  console.log('🔍 DEBUG MODAL - Mecánico seleccionado:', selectedMechanic)
                  console.log('🔍 DEBUG MODAL - Año/Mes:', selectedYear, selectedMonth)
                  return null
                })()}
                <div className="space-y-2">
                  {workOrders
                    .filter(trabajo => {
                      const fechaTrabajo = new Date(trabajo.fecha)
                      const añoTrabajo = fechaTrabajo.getFullYear()
                      const mesTrabajo = fechaTrabajo.getMonth() + 1 // getMonth() devuelve 0-11, sumamos 1 para 1-12
                      
                      const cumpleFecha = añoTrabajo === parseInt(selectedYear || '0') && 
                                         mesTrabajo === parseInt(selectedMonth || '0')
                      const tieneMecanico = trabajo.mecanicos_ids.includes(parseInt(selectedMechanic.id))
                      
                      // Debug más simple
                      if (trabajo.mecanicos_ids.includes(parseInt(selectedMechanic.id))) {
                        console.log('🔍 Trabajo con mecánico:', {
                          id: trabajo.id,
                          descripcion: trabajo.descripcion,
                          fecha: trabajo.fecha,
                          fechaTrabajo: fechaTrabajo.toString(),
                          año: añoTrabajo,
                          mes: mesTrabajo,
                          selectedYear: parseInt(selectedYear || '0'),
                          selectedMonth: parseInt(selectedMonth || '0'),
                          cumpleFecha,
                          mecanicos_ids: trabajo.mecanicos_ids,
                          selectedMechanicId: parseInt(selectedMechanic.id)
                        })
                      }
                      
                      return cumpleFecha && tieneMecanico
                    })
                    .map(trabajo => (
                      <div key={trabajo.id} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{trabajo.descripcion}</p>
                            <p className="text-sm text-gray-600">
                              {trabajo.matricula_carro} - {trabajo.cliente_nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(trabajo.fecha).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(trabajo.mano_obra || 0)}</p>
                            <p className="text-sm text-green-600">
                              Comisión: {formatCurrency((trabajo.mano_obra || 0) * 0.02 / (trabajo.mecanicos_ids.length || 1))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {workOrders.filter(trabajo => {
                    const fechaTrabajo = new Date(trabajo.fecha)
                    const añoTrabajo = fechaTrabajo.getFullYear()
                    const mesTrabajo = fechaTrabajo.getMonth() + 1
                    
                    return añoTrabajo === parseInt(selectedYear || '0') && 
                           mesTrabajo === parseInt(selectedMonth || '0') &&
                           trabajo.mecanicos_ids.includes(parseInt(selectedMechanic.id))
                  }).length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No hay trabajos asignados para este mecánico en el mes seleccionado.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
