"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Download, Users, Eye } from "lucide-react"
import { useMonthlyReset } from "@/hooks/use-monthly-reset"

interface MonthlyReport {
  month: string
  year: number
  totalIncome: number
  totalExpenses: number // Solo gastos de repuestos
  netProfit: number
  gastosTaller: number // Gastos del taller
  salarios: number // Salarios de empleados
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
  manoObra: number // ✅ Agregado: Mano de obra para calcular ganancia base
  comision: number // ✅ Agregado: Comisión del trabajo
  mechanicId?: number // ✅ Agregado: ID del mecánico asignado al trabajo
  // ✅ NUEVOS CAMPOS PARA MECÁNICOS
  mecanicosIds?: number[] // Lista completa de IDs de mecánicos asignados
  mecanicosNombres?: string[] // Lista de nombres de mecánicos asignados
  totalMecanicos?: number // Total de mecánicos asignados al trabajo
}

interface MecanicoResumen {
  id: string
  nombre: string
  totalSalarial: number
  totalComisiones: number
  totalGananciaBase: number
  margenGanancia: number
}

interface TrabajoMecanico {
  id: string
  fecha: string
  matricula: string
  cliente: string
  descripcion: string
  ganancia: number
  comision: number
  salario: number
}

export function ReportsSection() {
  console.log("🚀 ReportsSection renderizado, isAuthModalOpen:", false, "isAuthenticated:", true, "✅ AUTH TEMPORALMENTE DESACTIVADO")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([])
  const [workOrdersReport, setWorkOrdersReport] = useState<WorkOrderReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null)
  const [previousReport, setPreviousReport] = useState<MonthlyReport | null>(null)
  
  // Estados para gastos del taller y salarios
  const [gastosTaller, setGastosTaller] = useState<any[]>([])
  const [pagosSalarios, setPagosSalarios] = useState<any[]>([])
  const [estadisticasMecanicos, setEstadisticasMecanicos] = useState<Map<string, any>>(new Map())
  
  // Estados para el diálogo de detalle del mecánico
  const [isMecanicoDetalleOpen, setIsMecanicoDetalleOpen] = useState(false)
  const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState<MecanicoResumen | null>(null)
  const [trabajosMecanico, setTrabajosMecanico] = useState<TrabajoMecanico[]>([])
  
  // Estado para almacenar el resumen de mecánicos
  const [mecanicosResumen, setMecanicosResumen] = useState<MecanicoResumen[]>([])
  
  // Estados para autenticación simple - TEMPORALMENTE DESACTIVADO PARA DEBUG
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false) // ✅ DESACTIVADO: No se abre automáticamente
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(true) // ✅ DESACTIVADO: Siempre autenticado
  const [adminUsername] = useState("leonardo")
  
  // Estado de carga inicial
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Hook para manejar el reset mensual automático
  const {
    isNewMonth,
    shouldReset,
    executeReset,
    checkNewMonth
  } = useMonthlyReset({
    autoReset: true,
    resetDay: 1, // Reset el día 1 de cada mes
    preserveHistory: true
  })

  // Función para calcular otros gastos (gastos del taller + salarios)
  const calculateOtherExpenses = () => {
    if (!currentReport) {
      console.log("❌ calculateOtherExpenses: No hay currentReport")
      return 0
    }
    
    const gastosTaller = Number(currentReport.gastosTaller) || 0
    const salarios = Number(currentReport.salarios) || 0
    const total = gastosTaller + salarios
    
    console.log("💰 calculateOtherExpenses:", {
      gastosTaller,
      salarios,
      total,
      currentReport
    })
    
    return total
  }

  // Función para obtener resumen de mecánicos del mes
  const getMecanicosResumen = async (): Promise<MecanicoResumen[]> => {
    if (!selectedYear || !selectedMonth) return []
    
    const [year, month] = selectedMonth.split('-')
    const selectedYearNum = parseInt(year)
    const selectedMonthNum = parseInt(month)
    
    // Obtener mecánicos únicos
    const mecanicosUnicos = new Map<string, MecanicoResumen>()
    
    // Procesar salarios del mes para obtener la lista de mecánicos
    pagosSalarios.forEach(pago => {
      const fechaPago = new Date(pago.fecha_pago)
      if (fechaPago.getFullYear() === selectedYearNum && fechaPago.getMonth() === selectedMonthNum - 1) {
        const mecanicoId = pago.id_mecanico
        const nombreMecanico = pago.nombre_mecanico || "Mecánico"
        
        console.log(`🔍 Procesando pago para mecánico ${mecanicoId} (${nombreMecanico})`)
        
        if (!mecanicosUnicos.has(mecanicoId.toString())) {
          mecanicosUnicos.set(mecanicoId.toString(), {
            id: mecanicoId.toString(),
            nombre: nombreMecanico,
            totalSalarial: 0,
            totalComisiones: 0,
            totalGananciaBase: 0,
            margenGanancia: 0
          })
        }
        
        const mecanico = mecanicosUnicos.get(mecanicoId.toString())!
        mecanico.totalSalarial += Number(pago.monto_salario) || 0
      }
    })
    
    console.log("🔍 Mecánicos únicos encontrados en pagos:", Array.from(mecanicosUnicos.keys()))
    
    // ✅ OBTENER GANANCIA BASE INDIVIDUAL DE CADA MECÁNICO DEL ENDPOINT DE ESTADÍSTICAS
    console.log("🔧 Obteniendo ganancia base individual de cada mecánico")
    
    // Para cada mecánico, obtener sus estadísticas individuales del backend
    for (const [mecanicoId, mecanico] of mecanicosUnicos) {
      try {
        console.log(`🔧 Obteniendo estadísticas para mecánico ${mecanicoId} (${mecanico.nombre})...`)
        
        // Usar el endpoint de estadísticas para obtener la ganancia base individual
        const response = await fetch(`http://localhost:8000/api/mecanicos/${mecanicoId}/estadisticas?mes=${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}`)
        
        if (response.ok) {
          const stats = await response.json()
          console.log(`🔧 Estadísticas para mecánico ${mecanicoId}:`, stats)
          
          // ✅ CALCULAR GANANCIA BASE TOTAL SUMANDO LOS TRABAJOS ASIGNADOS AL MECÁNICO
          // Primero, obtener los trabajos del mes seleccionado
          const trabajosDelMes = workOrdersReport.filter(trabajo => {
            const fechaTrabajo = new Date(trabajo.date)
            return fechaTrabajo.getFullYear() === selectedYearNum && fechaTrabajo.getMonth() === selectedMonthNum - 1
          })
          
          // ✅ NUEVA LÓGICA: Filtrar trabajos asignados a este mecánico usando los nuevos campos
          const trabajosDelMecanico = trabajosDelMes.filter(trabajo => {
            // Verificar si el mecánico está en la lista de mecánicos asignados al trabajo
            if (trabajo.mecanicosIds && Array.isArray(trabajo.mecanicosIds)) {
              return trabajo.mecanicosIds.includes(Number(mecanicoId))
            }
            // Fallback: usar el campo mechanicId si existe
            if (trabajo.mechanicId && Number(trabajo.mechanicId) === Number(mecanicoId)) {
              return true
            }
            return false
          })
          
          console.log(`🔍 Trabajos del mes para mecánico ${mecanico.nombre}:`, trabajosDelMes.length)
          console.log(`🔍 Trabajos asignados al mecánico ${mecanico.nombre}:`, trabajosDelMecanico.length)
          
          // Debug: Mostrar detalles de los trabajos asignados
          console.log(`🔍 Detalles de trabajos asignados a ${mecanico.nombre}:`, trabajosDelMecanico.map(t => ({
            id: t.id,
            manoObra: t.manoObra,
            expenses: t.expenses,
            mecanicosIds: t.mecanicosIds,
            mecanicosNombres: t.mecanicosNombres
          })))
          
          // Calcular ganancia base total sumando (manoObra - expenses) de todos los trabajos asignados
          const gananciaBaseTotal = trabajosDelMecanico.reduce((sum, trabajo) => {
            const manoObra = Number(trabajo.manoObra) || 0
            const gastosReales = Number(trabajo.expenses) || 0
            const gananciaBaseTrabajo = manoObra - gastosReales
            console.log(`🔍 Trabajo ${trabajo.id}: manoObra ${manoObra}, gastos ${gastosReales}, ganancia base ${gananciaBaseTrabajo}`)
            return sum + Math.max(gananciaBaseTrabajo, 0)
          }, 0)
          
          // Usar la ganancia base calculada, no stats.total_ganancias
          mecanico.totalGananciaBase = gananciaBaseTotal
          // Usar comisiones_mes para las comisiones individuales del mecánico
          mecanico.totalComisiones = parseFloat(stats.comisiones_mes || 0)
          
          console.log(`🔧 Mecánico ${mecanico.nombre}:`, {
            gananciaBase: mecanico.totalGananciaBase,
            comision: mecanico.totalComisiones,
            salario: mecanico.totalSalarial
          })
        } else {
          console.warn(`⚠️ Error ${response.status} al obtener estadísticas para mecánico ${mecanicoId}`)
          mecanico.totalGananciaBase = 0
          mecanico.totalComisiones = 0
        }
      } catch (error) {
        console.warn(`⚠️ No se pudieron cargar estadísticas para mecánico ${mecanicoId}:`, error)
        mecanico.totalGananciaBase = 0
        mecanico.totalComisiones = 0
      }
    }
    
    // Calcular margen de ganancia (ganancia base - salario)
    mecanicosUnicos.forEach(mecanico => {
      mecanico.margenGanancia = mecanico.totalGananciaBase - mecanico.totalSalarial
    })
    
    const resultado = Array.from(mecanicosUnicos.values())
    
    // Logs de debug
    console.log("🔧 getMecanicosResumen - Datos procesados:", {
      selectedYear: selectedYearNum,
      selectedMonth: selectedMonthNum,
      estadisticasDisponibles: estadisticasMecanicos.size > 0,
      numeroMecanicos: mecanicosUnicos.size,
      estadisticasKeys: Array.from(estadisticasMecanicos.keys()),
      mecanicosKeys: Array.from(mecanicosUnicos.keys()),
      resultado
    })
    
    return resultado
  }

  // Función para abrir el diálogo de detalle del mecánico
  const openMecanicoDetalle = async (mecanico: MecanicoResumen) => {
    setMecanicoSeleccionado(mecanico)
    
    // Obtener trabajos del mecánico para el mes seleccionado
    if (selectedYear && selectedMonth) {
      const [year, month] = selectedMonth.split('-')
      const selectedYearNum = parseInt(year)
      const selectedMonthNum = parseInt(month)
      
      // Asegurar que las estadísticas estén cargadas antes de abrir el diálogo
      if (estadisticasMecanicos.size === 0) {
        console.log("🔄 Estadísticas no cargadas, cargando ahora...")
        await loadEstadisticasMecanicos()
      }
      
      const trabajosDelMes = workOrdersReport.filter(trabajo => {
        const fechaTrabajo = new Date(trabajo.date)
        return fechaTrabajo.getFullYear() === selectedYearNum && 
               fechaTrabajo.getMonth() === selectedMonthNum - 1
      })
      
      // Debug: Ver qué datos llegan del backend
      console.log("🔍 Trabajos del mes encontrados:", trabajosDelMes)
      console.log("🔍 Primer trabajo (ejemplo):", trabajosDelMes[0])
      
      // Obtener estadísticas del mecánico para calcular comisiones
      const mecanicoId = mecanico.id.toString()
      const estadisticas = estadisticasMecanicos.get(mecanicoId)
      console.log("🔍 Estadísticas del mecánico:", mecanicoId, estadisticas)
      console.log("🔍 Map completo de estadísticas:", estadisticasMecanicos)
      console.log("🔍 Keys disponibles:", Array.from(estadisticasMecanicos.keys()))
      
              // ✅ NUEVA LÓGICA: Filtrar solo los trabajos asignados a este mecánico específico
      const trabajosDelMecanico = trabajosDelMes.filter(trabajo => {
        // Verificar si el mecánico está en la lista de mecánicos asignados al trabajo
        if (trabajo.mecanicosIds && Array.isArray(trabajo.mecanicosIds)) {
          return trabajo.mecanicosIds.includes(Number(mecanico.id))
        }
        // Fallback: usar el campo mechanicId si existe
        if (trabajo.mechanicId && Number(trabajo.mechanicId) === Number(mecanico.id)) {
          return true
        }
        return false
      })
      
      console.log(`🔍 Trabajos del mes para mecánico ${mecanico.nombre}:`, trabajosDelMes.length)
      console.log(`🔍 Trabajos asignados al mecánico ${mecanico.nombre}:`, trabajosDelMecanico.length)
      
      // Usar la misma lógica de cálculo que work-orders-section.tsx
      const trabajosFormateados: TrabajoMecanico[] = trabajosDelMecanico.map(trabajo => {
        console.log(`🔍 Procesando trabajo ${trabajo.id}:`, {
          profit: trabajo.profit,
          income: trabajo.income,
          expenses: trabajo.expenses,
          manoObra: trabajo.manoObra,
          comision: trabajo.comision
        })
        
        // ✅ CALCULAR GANANCIA BASE INDIVIDUAL DEL TRABAJO:
        // Ganancia Base = Mano de Obra - Gastos Reales de Repuestos
        const gananciaBaseTrabajo = Number(trabajo.manoObra) - Number(trabajo.expenses)
        
        // ✅ CALCULAR COMISIÓN INDIVIDUAL DEL TRABAJO:
        // Comisión = 2% de la Ganancia Base (si es > 0)
        let comisionPorTrabajo = 0
        if (gananciaBaseTrabajo > 0) {
          comisionPorTrabajo = gananciaBaseTrabajo * 0.02
        }
        
        console.log(`🔍 Cálculos individuales para ${trabajo.id}:`, {
          manoObra: trabajo.manoObra,
          gastos: trabajo.expenses,
          gananciaBaseTrabajo,
          comisionCalculada: comisionPorTrabajo
        })
        
        return {
          id: trabajo.id,
          fecha: trabajo.date,
          matricula: trabajo.licensePlate,
          cliente: trabajo.clientName,
          descripcion: trabajo.description,
          ganancia: gananciaBaseTrabajo, // ✅ Ganancia base individual del trabajo
          comision: comisionPorTrabajo, // ✅ Comisión individual del trabajo
          salario: 0 // No mostramos salario por trabajo
        }
      })
      
      setTrabajosMecanico(trabajosFormateados)
      
      console.log("🔍 openMecanicoDetalle - Trabajos del mecánico:", {
        mecanico: mecanico.nombre,
        trabajosDelMes: trabajosDelMes.length,
        trabajosFormateados: trabajosFormateados.length,
        gananciaTotal: trabajosFormateados.reduce((sum, t) => sum + t.ganancia, 0),
        comisionTotal: trabajosFormateados.reduce((sum, t) => sum + t.comision, 0),
        // Ver los primeros 3 trabajos formateados para debug
        primerosTrabajos: trabajosFormateados.slice(0, 3)
      })
    }
    
    setIsMecanicoDetalleOpen(true)
  }

  // Función de autenticación simple - TEMPORALMENTE DESACTIVADO PARA DEBUG
  /*
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('http://localhost:8000/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: adminUsername,
          password: authPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsAuthenticated(true)
        setIsAuthModalOpen(false)
        setAuthPassword("")
        setAuthError("")
        setInitialLoading(false)
        console.log("✅ Autenticación exitosa para reportes")
      } else {
        setAuthError(data.message || "Error de autenticación")
        console.log("❌ Error de autenticación:", data.message)
      }
    } catch (error) {
      console.error("Error en autenticación:", error)
      setAuthError("Error de conexión. Intente nuevamente.")
    }
  }
  */

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

      // Obtener gastos del taller
      const responseGastos = await fetch("http://localhost:8000/api/gastos-taller/")
      if (!responseGastos.ok) {
        throw new Error("Error al cargar los gastos del taller")
      }
      const gastosTaller = await responseGastos.json()
      console.log("💰 Gastos del taller cargados:", gastosTaller)
      setGastosTaller(gastosTaller)

      // Obtener pagos de salarios
      const responseSalarios = await fetch("http://localhost:8000/api/pagos-salarios/")
      if (!responseSalarios.ok) {
        throw new Error("Error al cargar los pagos de salarios")
      }
      const pagosSalarios = await responseSalarios.json()
      console.log("💵 Pagos de salarios cargados:", pagosSalarios)
      setPagosSalarios(pagosSalarios)

      // Por ahora, no cargamos estadísticas aquí - se cargarán cuando se seleccione un mes
      console.log("ℹ️ Las estadísticas de mecánicos se cargarán cuando se seleccione un mes específico")

      // Debug: Ver qué campos tiene el primer trabajo del backend
      if (trabajos.length > 0) {
        console.log("🔍 Campos disponibles en el backend:", Object.keys(trabajos[0]))
        console.log("🔍 Primer trabajo completo:", trabajos[0])
        console.log("🔍 ¿Tiene campo comision?:", 'comision' in trabajos[0])
        console.log("🔍 ¿Tiene campo comision_mecanico?:", 'comision_mecanico' in trabajos[0])
        console.log("🔍 Valor de ganancia:", trabajos[0].ganancia)
        console.log("🔍 Valor de mano_obra:", trabajos[0].mano_obra)
        console.log("🔍 Valor de total_gastos:", trabajos[0].total_gastos)
      }
      
      // Debug: Ver qué campos tiene el primer trabajo del backend
      if (trabajos.length > 0) {
        console.log("🔍 Campos disponibles en el backend:", Object.keys(trabajos[0]))
        console.log("🔍 Primer trabajo completo:", trabajos[0])
        console.log("🔍 ¿Tiene campo comision?:", 'comision' in trabajos[0])
        console.log("🔍 ¿Tiene campo comision_mecanico?:", 'comision_mecanico' in trabajos[0])
        console.log("🔍 ¿Tiene campo mecanico_id?:", 'mecanico_id' in trabajos[0])
        console.log("🔍 ¿Tiene campo id_mecanico?:", 'id_mecanico' in trabajos[0])
        console.log("🔍 ¿Tiene campo mecanico?:", 'mecanico' in trabajos[0])
        console.log("🔍 ¿Tiene campo mecanico_asignado?:", 'mecanico_asignado' in trabajos[0])
        console.log("🔍 ¿Tiene campo asignado_a?:", 'asignado_a' in trabajos[0])
        console.log("🔍 Valor de ganancia:", trabajos[0].ganancia)
        console.log("🔍 Valor de mano_obra:", trabajos[0].mano_obra)
        console.log("🔍 Valor de total_gastos:", trabajos[0].total_gastos)
      }
      
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
          manoObra: trabajo.mano_obra || 0, // ✅ Agregado: Mano de obra del trabajo
          // Agregar campo de comisión si existe en el backend
          comision: trabajo.comision || trabajo.comision_mecanico || 0,
          // ✅ NUEVO: Usar los campos de mecánicos del backend
          mechanicId: trabajo.mecanicos_ids && trabajo.mecanicos_ids.length > 0 ? trabajo.mecanicos_ids[0] : null, // Primer mecánico asignado
          mecanicosIds: trabajo.mecanicos_ids || [], // Lista completa de IDs de mecánicos
          mecanicosNombres: trabajo.mecanicos_nombres || [], // Lista de nombres de mecánicos
          totalMecanicos: trabajo.total_mecanicos || 0, // Total de mecánicos asignados
        }))

      setWorkOrdersReport(transformedWorkOrders)

      // Generar reportes mensuales con datos completos
      const monthlyData = generateMonthlyReports(transformedWorkOrders, gastosTaller, pagosSalarios)
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

  // Función para generar reportes mensuales con datos completos
  const generateMonthlyReports = (workOrders: WorkOrderReport[], gastosTaller: any[], pagosSalarios: any[]): MonthlyReport[] => {
    const monthlyMap = new Map<string, MonthlyReport>()

    // Procesar trabajos (ingresos y gastos de repuestos)
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
          gastosTaller: 0,
          salarios: 0,
        })
      }

      const monthData = monthlyMap.get(monthKey)!
      monthData.totalIncome += order.income
      monthData.totalExpenses += order.expenses // Solo gastos de repuestos
      monthData.netProfit += order.profit
    })

    // Procesar gastos del taller
    console.log("💰 Procesando gastos del taller:", gastosTaller.length)
    gastosTaller.forEach(gasto => {
      const date = new Date(gasto.fecha_gasto)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyMap.has(monthKey)) {
        const monthData = monthlyMap.get(monthKey)!
        const montoGasto = Number(gasto.monto) || 0
        monthData.gastosTaller = (monthData.gastosTaller || 0) + montoGasto
        console.log(`💰 Gasto taller ${monthKey}: ${montoGasto} (tipo: ${typeof montoGasto}) -> Total: ${monthData.gastosTaller} (tipo: ${typeof monthData.gastosTaller})`)
      }
    })

    // Procesar pagos de salarios
    console.log("💵 Procesando pagos de salarios:", pagosSalarios.length)
    pagosSalarios.forEach(pago => {
      const date = new Date(pago.fecha_pago)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyMap.has(monthKey)) {
        const monthData = monthlyMap.get(monthKey)!
        const montoSalario = Number(pago.monto_salario) || 0
        monthData.salarios = (monthData.salarios || 0) + montoSalario
        console.log(`💵 Salario ${monthKey}: ${montoSalario} (tipo: ${typeof montoSalario}) -> Total: ${monthData.salarios} (tipo: ${typeof monthData.salarios})`)
      }
    })

    // Ordenar por fecha (más reciente primero)
    const result = Array.from(monthlyMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return getMonthNumber(b.month) - getMonthNumber(a.month)
      })
    
    console.log("📊 Reportes mensuales generados:", result)
    return result
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

  // Cargar estadísticas de mecánicos para el mes seleccionado
  const loadEstadisticasMecanicos = async () => {
    if (!selectedYear || !selectedMonth) return
    
    try {
      console.log("🔧 Cargando estadísticas de mecánicos para:", selectedYear, selectedMonth)
      
      // Obtener todos los mecánicos disponibles
      const responseMecanicos = await fetch("http://localhost:8000/api/mecanicos/")
      if (responseMecanicos.ok) {
        const mecanicos = await responseMecanicos.json()
        const estadisticasMap = new Map<string, any>()
        
        console.log("🔍 Mecánicos disponibles:", mecanicos)
        
        for (const mecanico of mecanicos) {
          try {
            // Obtener estadísticas del mes seleccionado
            const mesParam = `${selectedYear}-${selectedMonth.split('-')[1]}`
            const response = await fetch(`http://localhost:8000/api/mecanicos/${mecanico.id}/estadisticas?mes=${mesParam}`)
            if (response.ok) {
              const stats = await response.json()
              estadisticasMap.set(mecanico.id.toString(), stats)
              console.log(`💰 Estadísticas para mecánico ${mecanico.id} (${mecanico.nombre}) en ${mesParam}:`, stats)
            } else {
              console.warn(`⚠️ Error ${response.status} al obtener estadísticas para mecánico ${mecanico.id}`)
            }
          } catch (error) {
            console.warn(`⚠️ No se pudieron cargar estadísticas para mecánico ${mecanico.id}:`, error)
          }
        }
        
        setEstadisticasMecanicos(estadisticasMap)
        console.log("💰 Estadísticas de mecánicos cargadas:", estadisticasMap)
        console.log("💰 Contenido del Map:", Object.fromEntries(estadisticasMap))
      } else {
        console.warn("⚠️ No se pudieron cargar los mecánicos")
        setEstadisticasMecanicos(new Map())
      }
    } catch (error) {
      console.warn("⚠️ No se pudieron cargar las estadísticas de mecánicos:", error)
      setEstadisticasMecanicos(new Map())
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      loadReportsData()
    } else {
      // Si no está autenticado, no mostrar loading
      setLoading(false)
      setInitialLoading(false)
    }
  }, [isAuthenticated])

  // Efecto para manejar el reset automático de reportes
  useEffect(() => {
    if (shouldReset || isNewMonth) {
      console.log('🔄 Reset mensual detectado - Limpiando reportes')
      
      // Resetear a mes actual
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      
      setSelectedYear(currentYear.toString())
      setSelectedMonth(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
      
      // Limpiar datos localmente
      setMonthlyReports([])
      setWorkOrdersReport([])
      setCurrentReport(null)
      setPreviousReport(null)
      setMecanicosResumen([])
      setEstadisticasMecanicos(new Map())
      
      // Recargar datos del nuevo mes
      if (isAuthenticated) {
        loadReportsData()
      }
    }
  }, [shouldReset, isNewMonth, isAuthenticated, loadReportsData])

  // Escuchar eventos de reset manual
  useEffect(() => {
    const handleMonthlyReset = () => {
      console.log('🔄 Reset manual ejecutado - Limpiando reportes')
      
      // Resetear a mes actual
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      
      setSelectedYear(currentYear.toString())
      setSelectedMonth(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
      
      // Limpiar datos localmente
      setMonthlyReports([])
      setWorkOrdersReport([])
      setCurrentReport(null)
      setPreviousReport(null)
      setMecanicosResumen([])
      setEstadisticasMecanicos(new Map())
      
      // Recargar datos del nuevo mes
      if (isAuthenticated) {
        loadReportsData()
      }
    }

    window.addEventListener('monthlyReset', handleMonthlyReset)
    return () => window.removeEventListener('monthlyReset', handleMonthlyReset)
  }, [isAuthenticated, loadReportsData])

  // Cargar estadísticas de mecánicos cuando cambie el mes seleccionado
  useEffect(() => {
    if (selectedYear && selectedMonth && isAuthenticated) {
      console.log("🔄 useEffect: Cargando estadísticas para:", selectedYear, selectedMonth)
      loadEstadisticasMecanicos()
    }
  }, [selectedYear, selectedMonth, isAuthenticated])
  
  // Cargar resumen de mecánicos cuando cambie el mes seleccionado
  useEffect(() => {
    if (selectedYear && selectedMonth && isAuthenticated) {
      const cargarMecanicos = async () => {
        const mecanicos = await getMecanicosResumen()
        setMecanicosResumen(mecanicos)
      }
      cargarMecanicos()
    }
  }, [selectedYear, selectedMonth, isAuthenticated])

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

  // Si no está autenticado, mostrar solo el modal - TEMPORALMENTE DESACTIVADO PARA DEBUG
  /*
  if (!isAuthenticated) {
    console.log("🔒 Usuario no autenticado, mostrando modal")
    return (
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="sm:max-w-[425px] mx-4 sm:mx-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-lg">
              🔐 Acceso a Reportes Financieros
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 text-blue-600">
                  <BarChart3 className="w-8 h-8" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Los reportes financieros están protegidos por contraseña.<br/>
                Solo personal autorizado puede acceder a esta información.
              </p>
            </div>
            
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authPassword" className="text-sm font-medium">
                  Contraseña del Taller
                </Label>
                <Input
                  id="authPassword"
                  type="password"
                  value={authPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthPassword(e.target.value)}
                  placeholder="Ingrese la contraseña"
                  className="w-full"
                  autoFocus
                />
              </div>
              
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{authError}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Desbloquear
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  */

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
              <div className="text-xs text-gray-500">
                Suma de todos los cobros a clientes
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
              Gastos Repuestos
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
              <div className="text-xs text-gray-500">
                Solo gastos de repuestos por trabajos
              </div>
              <div className="text-xs text-gray-400">
                (No incluye gastos del taller ni salarios)
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

        {/* Tercer dashboard - Gastos Taller */}
        <Card className="aspect-square sm:aspect-auto">
          <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              Gastos Taller
              {selectedYear && selectedMonth && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({selectedMonth.split('-')[1]}/{selectedYear})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">
                {formatCurrency(calculateOtherExpenses())}
              </div>
              <div className="text-xs text-gray-500">
                Gastos del taller + salarios empleados
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
              <div className="text-xs text-gray-500">
                Ganancia base + markup de repuestos
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
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Gastos Repuestos</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">Gastos Taller</TableHead>
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
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-orange-600 hidden lg:table-cell">
                        {formatCurrency(report.gastosTaller + report.salarios)}
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

      {/* Mecánicos - Resumen del Mes */}
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mecánicos {selectedYear && selectedMonth && (
              <span className="text-sm font-normal text-muted-foreground">
                - {selectedMonth.split('-')[1]}/{selectedYear}
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Resumen de salarios, comisiones y ganancias por mecánico en el mes seleccionado. 
            La ganancia base se calcula como: Mano de Obra - Gastos Reales de Repuestos
          </p>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Mecánico</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Total Salarial</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">Total Comisiones</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">Ganancia Base</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Margen de Ganancia</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mecanicosResumen.map((mecanico) => (
                    <TableRow key={mecanico.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium px-2 sm:px-4 text-xs sm:text-sm">
                        {mecanico.nombre}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-red-600 hidden sm:table-cell">
                        {formatCurrency(mecanico.totalSalarial)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-blue-600 hidden md:table-cell">
                        {formatCurrency(mecanico.totalComisiones)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium text-green-600 hidden lg:table-cell">
                        {formatCurrency(mecanico.totalGananciaBase)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          mecanico.margenGanancia >= 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {mecanico.margenGanancia >= 0 ? '+' : ''}{formatCurrency(mecanico.margenGanancia)}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 text-xs sm:text-sm text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMecanicoDetalle(mecanico)}
                          className="h-7 px-2 text-xs"
                        >
                          Ver Más
                        </Button>
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

      {/* Diálogo de Detalle del Mecánico */}
      <Dialog open={isMecanicoDetalleOpen} onOpenChange={setIsMecanicoDetalleOpen}>
        <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detalle del Mecánico: {mecanicoSeleccionado?.nombre}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedYear && selectedMonth && (
                <>Mes: {selectedMonth.split('-')[1]}/{selectedYear}</>
              )}
            </p>
          </DialogHeader>
          
          {mecanicoSeleccionado && (
            <div className="space-y-6">
              {/* Resumen del Mecánico */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-xs font-medium text-red-600">Total Salarial</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold">{formatCurrency(mecanicoSeleccionado.totalSalarial)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-xs font-medium text-blue-600">Total Comisiones</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold">{formatCurrency(mecanicoSeleccionado.totalComisiones)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-xs font-medium text-green-600">Total Ganancia Base</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold">{formatCurrency(mecanicoSeleccionado.totalGananciaBase)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-xs font-medium">Margen de Ganancia</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className={`text-lg font-bold ${
                      mecanicoSeleccionado.margenGanancia >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mecanicoSeleccionado.margenGanancia >= 0 ? '+' : ''}{formatCurrency(mecanicoSeleccionado.margenGanancia)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Trabajos del Mecánico */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Trabajos Realizados en el Mes</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-3 py-2 text-xs">Fecha</TableHead>
                        <TableHead className="px-3 py-2 text-xs">ID</TableHead>
                        <TableHead className="px-3 py-2 text-xs">Placa</TableHead>
                        <TableHead className="px-3 py-2 text-xs">Cliente</TableHead>
                        <TableHead className="px-3 py-2 text-xs">Descripción</TableHead>
                        <TableHead className="px-3 py-2 text-xs">Ganancia Base</TableHead>
                        <TableHead className="px-3 py-2 text-xs">Comisión</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trabajosMecanico.length > 0 ? (
                        trabajosMecanico.map((trabajo) => (
                          <TableRow key={trabajo.id} className="hover:bg-gray-50">
                            <TableCell className="px-3 py-2 text-xs">{formatDate(trabajo.fecha)}</TableCell>
                            <TableCell className="font-medium px-3 py-2 text-xs">{trabajo.id}</TableCell>
                            <TableCell className="px-3 py-2 text-xs">{trabajo.matricula}</TableCell>
                            <TableCell className="px-3 py-2 text-xs max-w-[120px] truncate">{trabajo.cliente}</TableCell>
                            <TableCell className="px-3 py-2 text-xs max-w-[150px] truncate">{trabajo.descripcion}</TableCell>
                            <TableCell className="px-3 py-2 text-xs font-medium text-green-600">{formatCurrency(trabajo.ganancia)}</TableCell>
                            <TableCell className="px-3 py-2 text-xs font-medium text-blue-600">{formatCurrency(trabajo.comision)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                                                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay trabajos para este mecánico en el período seleccionado
                        </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
