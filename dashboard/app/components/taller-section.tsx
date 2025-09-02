"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { buildApiUrl } from "../lib/api-config"
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
import { Plus, Search, Eye, Edit, Trash2, DollarSign, Calendar, TrendingUp, RefreshCw, Wrench, Users, Zap, Droplets } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { mecanicosApi } from "@/lib/api-client"

// Interfaces para los tipos de datos
interface GastoTaller {
  id: string
  descripcion: string
  monto: number
  categoria: string
  fecha_gasto: string
  created_at: string
  updated_at: string
}

interface PagoSalario {
   id: string
   id_mecanico: string
   nombre_mecanico: string
   monto_salario: number
   semana_pago: string // Ahora será "1", "2", "3" o "4"
   fecha_pago: string
   created_at: string
 }

interface Mecanico {
  id: string
  nombre: string
}

interface GastoTallerCreate {
  descripcion: string
  monto: number
  categoria: string
  fecha_gasto: string
}

interface PagoSalarioCreate {
   id_mecanico: string
   monto_salario: number
   semana_pago: string // Ahora será "1", "2", "3" o "4"
   fecha_pago: string
 }

// Nueva interfaz para comisiones por quincena
interface ComisionQuincena {
  id: string
  id_mecanico: string
  monto_comision: number
  fecha_comision: string
  descripcion_trabajo: string
  ganancia_base: number
  estado: string // Estado de la comisión: PENDIENTE, APROBADA, PENALIZADA
}

// Nueva interfaz para el estado de aprobación de la quincena
interface EstadoQuincena {
  mecanicoId: string
  quincena: string
  estado: "PENDIENTE" | "APROBADA" | "DENEGADA"
  totalComisiones: number
}

export function TallerSection() {
  // Estados para gastos del taller
  const [gastos, setGastos] = useState<GastoTaller[]>([])
  const [loadingGastos, setLoadingGastos] = useState(true)
  const [errorGastos, setErrorGastos] = useState<string | null>(null)
  const [searchTermGastos, setSearchTermGastos] = useState("")
  const [isCreateGastoDialogOpen, setIsCreateGastoDialogOpen] = useState(false)
  const [isViewGastoDialogOpen, setIsViewGastoDialogOpen] = useState(false)
  const [isEditGastoDialogOpen, setIsEditGastoDialogOpen] = useState(false)
  const [isDeleteGastoDialogOpen, setIsDeleteGastoDialogOpen] = useState(false)
  const [selectedGasto, setSelectedGasto] = useState<GastoTaller | null>(null)
  const [newGasto, setNewGasto] = useState<GastoTallerCreate>({
    descripcion: "",
    monto: 0,
    categoria: "",
    fecha_gasto: new Date().toISOString().split('T')[0]
  })
  const [categoriaPersonalizada, setCategoriaPersonalizada] = useState("")
  const [editGasto, setEditGasto] = useState<GastoTallerCreate>({
    descripcion: "",
    monto: 0,
    categoria: "",
    fecha_gasto: new Date().toISOString().split('T')[0]
  })
  const [editCategoriaPersonalizada, setEditCategoriaPersonalizada] = useState("")

       // Función para obtener la semana actual (1-4)
  const obtenerSemanaActual = useCallback(() => {
    const fecha = new Date()
    const dia = fecha.getDate()
    // Calcular semana del mes (1-4)
    const semana = Math.ceil(dia / 7)
    const resultado = Math.min(semana, 4).toString() // Asegurar que no sea mayor a 4
    console.log("📅 obtenerSemanaActual:", { fecha: fecha.toISOString(), dia, semana, resultado })
    return resultado
  }, [])

  // Función para detectar si es el fin del mes (domingo de la cuarta semana)
  const esFinDeMes = useCallback(() => {
    const fecha = new Date()
    const dia = fecha.getDate()
    const diaSemana = fecha.getDay() // 0 = domingo, 1 = lunes, etc.
    
    // Calcular el último domingo del mes
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
    const ultimoDomingo = new Date(ultimoDia)
    
    // Retroceder hasta encontrar el domingo anterior
    while (ultimoDomingo.getDay() !== 0) {
      ultimoDomingo.setDate(ultimoDomingo.getDate() - 1)
    }
    
    // Verificar si hoy es el domingo de la cuarta semana o el último domingo del mes
    const esDomingo = diaSemana === 0
    const esCuartaSemana = Math.ceil(dia / 7) === 4
    const esUltimoDomingo = fecha.getDate() === ultimoDomingo.getDate()
    
    // También considerar si estamos en los últimos días del mes (últimos 3 días)
    const esUltimosDias = dia >= ultimoDia.getDate() - 2
    
    const resultado = esDomingo && (esCuartaSemana || esUltimoDomingo || esUltimosDias)
    console.log("📅 esFinDeMes:", {
      fecha: fecha.toISOString(),
      dia,
      diaSemana,
      esDomingo,
      esCuartaSemana,
      esUltimoDomingo,
      esUltimosDias,
      resultado
    })
    
    return resultado
  }, [])

  // Función para obtener años disponibles en la base de datos
  const obtenerAnosDisponibles = useCallback(async () => {
    try {
      console.log("📅 Obteniendo años disponibles...")
      const response = await fetch(buildApiUrl('/gastos-taller'))
      if (!response.ok) return
      
      const gastos = await response.json()
      const anosGastos = gastos.map((g: any) => 
        new Date(g.fecha_gasto).getFullYear()
      )
      console.log("📅 Años de gastos:", anosGastos)
      
      const responseSalarios = await fetch(buildApiUrl('/pagos-salarios'))
      if (responseSalarios.ok) {
        const salarios = await responseSalarios.json()
        const anosSalarios = salarios.map((s: any) => 
          new Date(s.fecha_pago).getFullYear()
        )
        console.log("📅 Años de salarios:", anosSalarios)
        
        const todosLosAnos = [...new Set([...anosGastos, ...anosSalarios])]
        const anosOrdenados = todosLosAnos.sort((a, b) => b - a) // Orden descendente
        console.log("📅 Años disponibles:", anosOrdenados)
        setAvailableYears(anosOrdenados)
      }
    } catch (error) {
      console.error("❌ Error al obtener años disponibles:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
    }
  }, [])

   // Estados para pagos de salarios
   const [pagosSalarios, setPagosSalarios] = useState<PagoSalario[]>([])
   const [loadingPagos, setLoadingPagos] = useState(true)
   const [errorPagos, setErrorPagos] = useState<string | null>(null)
   const [isPagoSalariosDialogOpen, setIsPagoSalariosDialogOpen] = useState(false)
   const [mecanicos, setMecanicos] = useState<Mecanico[]>([])
   const [nuevoPagoSalario, setNuevoPagoSalario] = useState<PagoSalarioCreate>({
     id_mecanico: "",
     monto_salario: 0,
     semana_pago: obtenerSemanaActual(),
     fecha_pago: new Date().toISOString().split('T')[0]
   })
   
   // Log del estado inicial
   console.log("🚀 Estado inicial de nuevoPagoSalario:", nuevoPagoSalario)

  // Estados para comisiones por quincena
  const [comisionesQuincena, setComisionesQuincena] = useState<ComisionQuincena[]>([])
  const [loadingComisiones, setLoadingComisiones] = useState(false)
  const [estadoQuincena, setEstadoQuincena] = useState<EstadoQuincena | null>(null)
  const [loadingEstadoQuincena, setLoadingEstadoQuincena] = useState(false)
  const [totalPagoConComision, setTotalPagoConComision] = useState(0)
  const [mensajeDenegacion, setMensajeDenegacion] = useState<string | null>(null)
  
  // Estado para popup de confirmación al denegar comisiones
  const [showConfirmDenegar, setShowConfirmDenegar] = useState(false)
  
  // Estado para popup de alerta de pago duplicado
  const [showPagoDuplicadoAlert, setShowPagoDuplicadoAlert] = useState(false)
  const [pagoDuplicadoInfo, setPagoDuplicadoInfo] = useState<{mecanico: string, semana: string, fecha: string, monto: number} | null>(null)

     // Estados generales
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [mostrarGastos, setMostrarGastos] = useState(true)
  
         // Estados para navegación temporal
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()) // Empezar en el mes actual
    const [availableYears, setAvailableYears] = useState<number[]>([])
    const [isCurrentPeriod, setIsCurrentPeriod] = useState(true) // Empezar como período actual

   // Categorías predefinidas para gastos
   const categoriasGastos = [
     { value: "luz", label: "Luz", icon: Zap },
     { value: "agua", label: "Agua", icon: Droplets },
     { value: "herramientas", label: "Herramientas", icon: Wrench },
     { value: "materiales", label: "Materiales", icon: Wrench },
     { value: "servicios", label: "Servicios", icon: Wrench },
     { value: "otros", label: "Otros", icon: Wrench }
   ]





  const cargarDatos = useCallback(async () => {
    try {
      console.log("📊 Cargando datos...")
      // Cargar gastos del taller
      await cargarGastos()
      // Cargar pagos de salarios
      await cargarPagosSalarios()
      // Cargar mecánicos
      await cargarMecanicos()
      setLastUpdated(new Date())
      console.log("📊 Datos cargados exitosamente")
    } catch (error) {
      console.error("❌ Error al cargar datos:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
    }
  }, [selectedYear, selectedMonth])

  // Cargar datos iniciales
  useEffect(() => {
    console.log("🚀 useEffect inicial ejecutado")
    cargarDatos()
    obtenerAnosDisponibles()
  }, [cargarDatos, obtenerAnosDisponibles])

  // Recargar datos cuando cambien las fechas seleccionadas
  useEffect(() => {
    console.log("📅 useEffect fechas seleccionadas ejecutado:", {
      selectedYear,
      selectedMonth,
      availableYearsLength: availableYears.length
    })
    
    if (availableYears.length > 0) { // Solo ejecutar cuando ya tengamos años disponibles
      console.log("📅 Recargando datos por cambio de fechas")
      cargarDatos()
    }
  }, [selectedYear, selectedMonth, availableYears.length, cargarDatos])



  // Verificar fin de mes cada hora (para detectar cambios automáticamente)
  useEffect(() => {
    const verificarFinDeMes = () => {
      if (esFinDeMes()) {
        console.log("🕐 Verificación horaria: FIN DE MES detectado")
        const fechaActual = new Date()
        const anoActual = fechaActual.getFullYear()
        const mesActual = fechaActual.getMonth()
        
        // Solo reiniciar si estamos en el período actual
        if (selectedYear === anoActual && selectedMonth === mesActual) {
          console.log("🔄 Reiniciando automáticamente al nuevo mes...")
          setSelectedYear(anoActual)
          setSelectedMonth(mesActual)
          setGastos([])
          setPagosSalarios([])
          cargarDatos()
        }
      }
    }

    // Verificar inmediatamente
    verificarFinDeMes()
    
    // Configurar verificación cada hora
    const interval = setInterval(verificarFinDeMes, 60 * 60 * 1000) // 1 hora
    
    return () => clearInterval(interval)
  }, [esFinDeMes, selectedYear, selectedMonth, cargarDatos])

  // Función para verificar si estamos en el período actual
  const verificarPeriodoActual = useCallback(() => {
    const fechaActual = new Date()
    const anoActual = fechaActual.getFullYear()
    const mesActual = fechaActual.getMonth()
    
    const esPeriodoActual = selectedYear === anoActual && selectedMonth === mesActual
    console.log("📅 verificarPeriodoActual:", {
      selectedYear,
      selectedMonth,
      anoActual,
      mesActual,
      esPeriodoActual
    })
    
    setIsCurrentPeriod(esPeriodoActual)
    
    // Si es fin de mes y estamos en período actual, reiniciar datos
    if (esFinDeMes() && esPeriodoActual) {
      console.log("🔄 FIN DE MES DETECTADO - Reiniciando datos...")
      // Reiniciar a datos del mes actual
      setSelectedYear(anoActual)
      setSelectedMonth(mesActual)
      // Limpiar las listas localmente (sin afectar la base de datos)
      setGastos([])
      setPagosSalarios([])
      // Recargar datos del nuevo mes
      cargarDatos()
    }
  }, [selectedYear, selectedMonth, esFinDeMes, cargarDatos])

  // Verificar período actual cuando cambien las fechas seleccionadas
  useEffect(() => {
    console.log("📅 useEffect verificarPeriodoActual ejecutado:", {
      selectedYear,
      selectedMonth
    })
    verificarPeriodoActual()
  }, [selectedYear, selectedMonth, verificarPeriodoActual])

  // Verificar período actual al inicio
  useEffect(() => {
    console.log("🚀 useEffect inicial verificarPeriodoActual ejecutado")
    verificarPeriodoActual()
  }, [verificarPeriodoActual])

    // Función para cargar gastos del taller
  const cargarGastos = useCallback(async () => {
    try {
      console.log("💰 Cargando gastos del taller...")
      setLoadingGastos(true)
      setErrorGastos(null)
      
      const response = await fetch(buildApiUrl('/gastos-taller'))
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log("💰 Gastos recibidos de la API:", data)
      
      // Convertir los datos al formato esperado por el frontend
      const gastosFormateados = data.map((gasto: any) => ({
        id: gasto.id.toString(),
        descripcion: gasto.descripcion,
        monto: parseFloat(gasto.monto),
        categoria: gasto.categoria,
        fecha_gasto: gasto.fecha_gasto.split('T')[0], // Convertir a formato YYYY-MM-DD
        created_at: gasto.created_at,
        updated_at: gasto.updated_at
      }))
      console.log("💰 Gastos formateados:", gastosFormateados)
      
              // Filtrar por año y mes seleccionados
        console.log(`Filtrando gastos - SelectedYear: ${selectedYear}, SelectedMonth: ${selectedMonth}`)
        const gastosFiltrados = gastosFormateados.filter((gasto: GastoTaller) => {
          const fechaGasto = new Date(gasto.fecha_gasto)
          const anoGasto = fechaGasto.getFullYear()
          const mesGasto = fechaGasto.getMonth()
          const coincide = anoGasto === selectedYear && mesGasto === selectedMonth
          
          console.log(`Gasto: ${gasto.descripcion}, Fecha: ${gasto.fecha_gasto}, Año: ${anoGasto}, Mes: ${mesGasto}, Selected: ${selectedYear}/${selectedMonth}, Coincide: ${coincide}`)
          
          return coincide
        })
       
      console.log("💰 Gastos filtrados:", gastosFiltrados)
      setGastos(gastosFiltrados)
    } catch (error) {
      console.error("❌ Error al cargar gastos:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
      setErrorGastos("Error al cargar los gastos del taller")
    } finally {
      setLoadingGastos(false)
    }
  }, [selectedYear, selectedMonth])

  // Función para cargar pagos de salarios
  const cargarPagosSalarios = useCallback(async () => {
    try {
      console.log("💵 Cargando pagos de salarios...")
      setLoadingPagos(true)
      setErrorPagos(null)
      
      const response = await fetch(buildApiUrl('/pagos-salarios'))
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log("💵 Pagos recibidos de la API:", data)
      
      // Convertir los datos al formato esperado por el frontend
      const pagosFormateados = data.map((pago: any) => ({
        id: pago.id.toString(),
        id_mecanico: pago.id_mecanico.toString(),
        nombre_mecanico: pago.nombre_mecanico || "Mecánico",
        monto_salario: parseFloat(pago.monto_salario),
        semana_pago: pago.semana_pago,
        fecha_pago: pago.fecha_pago.split('T')[0], // Convertir a formato YYYY-MM-DD
        created_at: pago.created_at
      }))
      console.log("💵 Pagos formateados:", pagosFormateados)
      
      // Filtrar por año y mes seleccionados
      const pagosFiltrados = pagosFormateados.filter((pago: PagoSalario) => {
        const fechaPago = new Date(pago.fecha_pago)
        return fechaPago.getFullYear() === selectedYear && 
               fechaPago.getMonth() === selectedMonth
      })
      
      console.log("💵 Pagos filtrados:", pagosFiltrados)
      setPagosSalarios(pagosFiltrados)
    } catch (error) {
      console.error("❌ Error al cargar pagos de salarios:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
      setErrorPagos("Error al cargar los pagos de salarios")
    } finally {
      setLoadingPagos(false)
    }
  }, [selectedYear, selectedMonth])

  // Función para verificar si ya existe un pago para un mecánico en una quincena específica
  const verificarPagoExistente = useCallback((mecanicoId: string, semana: string, fechaPago: string) => {
    const fechaPagoObj = new Date(fechaPago)
    const año = fechaPagoObj.getFullYear()
    const mes = fechaPagoObj.getMonth()
    
    // Buscar si ya existe un pago para este mecánico en esta quincena del mismo mes y año
    const pagoExistente = pagosSalarios.find(pago => {
      const fechaPagoExistente = new Date(pago.fecha_pago)
      return pago.id_mecanico === mecanicoId && 
             pago.semana_pago === semana &&
             fechaPagoExistente.getFullYear() === año &&
             fechaPagoExistente.getMonth() === mes
    })
    
    return pagoExistente
  }, [pagosSalarios])

  // Función para cargar mecánicos
  const cargarMecanicos = useCallback(async () => {
    try {
      console.log("👥 Cargando mecánicos...")
      const response = await fetch(buildApiUrl('/mecanicos'))
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log("👥 Mecánicos recibidos de la API:", data)
      
      // Convertir los datos al formato esperado por el frontend
      const mecanicosFormateados = data.map((mecanico: any) => ({
        id: mecanico.id.toString(),
        nombre: mecanico.nombre
      }))
      
      console.log("👥 Mecánicos formateados:", mecanicosFormateados)
      setMecanicos(mecanicosFormateados)
    } catch (error) {
      console.error("❌ Error al cargar mecánicos:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
    }
  }, [])

  // Filtrar gastos basado en término de búsqueda
  const filteredGastos = useMemo(() => {
    if (!searchTermGastos) return gastos

    return gastos.filter(
      (gasto) =>
        gasto.descripcion.toLowerCase().includes(searchTermGastos.toLowerCase()) ||
        gasto.categoria.toLowerCase().includes(searchTermGastos.toLowerCase())
    )
  }, [gastos, searchTermGastos])

  // Estadísticas de gastos del taller
  const statsGastosTaller = useMemo(() => {
    const totalGastos = gastos.length
    const totalMonto = gastos.reduce((sum, gasto) => sum + gasto.monto, 0)
    
    // Usar las fechas seleccionadas en lugar de la fecha actual
    const gastosMes = gastos.filter(gasto => {
      const fechaGasto = new Date(gasto.fecha_gasto)
      return fechaGasto.getMonth() === selectedMonth && 
             fechaGasto.getFullYear() === selectedYear
    })
    const totalMes = gastosMes.reduce((sum, gasto) => sum + gasto.monto, 0)

    return {
      totalGastos,
      totalMonto,
      totalMes,
      gastosMes: gastosMes.length
    }
  }, [gastos, selectedYear, selectedMonth])

  // Estadísticas de salarios
  const statsSalarios = useMemo(() => {
    const totalPagos = pagosSalarios.length
    const totalSalarios = pagosSalarios.reduce((sum, pago) => sum + pago.monto_salario, 0)
    
    // Usar las fechas seleccionadas en lugar de la fecha actual
    const pagosMes = pagosSalarios.filter(pago => {
      const fechaPago = new Date(pago.fecha_pago)
      return fechaPago.getMonth() === selectedMonth && 
             fechaPago.getFullYear() === selectedYear
    })
    const totalMes = pagosMes.reduce((sum, pago) => sum + pago.monto_salario, 0)

    return {
      totalPagos,
      totalSalarios,
      totalMes,
      pagosMes: pagosMes.length
    }
  }, [pagosSalarios, selectedYear, selectedMonth])

  // Estadísticas combinadas (gastos + salarios)
  const statsCombinadas = useMemo(() => {
    const totalGastosCombinados = statsGastosTaller.totalMonto + statsSalarios.totalSalarios
    const totalMesCombinado = statsGastosTaller.totalMes + statsSalarios.totalMes
    
    return {
      totalGastosCombinados,
      totalMesCombinado
    }
  }, [statsGastosTaller, statsSalarios])

  // Funciones para gastos del taller
  const handleCreateGasto = useCallback(async () => {
    if (!newGasto.descripcion.trim() || !newGasto.categoria.trim() || newGasto.monto <= 0) return

    // Si la categoría es "otros", usar la categoría personalizada
    const categoriaFinal = newGasto.categoria === "otros" ? categoriaPersonalizada : newGasto.categoria
    if (newGasto.categoria === "otros" && !categoriaPersonalizada.trim()) return

    try {
      const response = await fetch(buildApiUrl('/gastos-taller'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newGasto, 
          categoria: categoriaFinal,
          fecha_gasto: new Date(newGasto.fecha_gasto).toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const gastoCreado = await response.json()
      
      // Convertir al formato del frontend
      const gastoFormateado: GastoTaller = {
        id: gastoCreado.id.toString(),
        descripcion: gastoCreado.descripcion,
        monto: parseFloat(gastoCreado.monto),
        categoria: gastoCreado.categoria,
        fecha_gasto: gastoCreado.fecha_gasto.split('T')[0],
        created_at: gastoCreado.created_at,
        updated_at: gastoCreado.updated_at
      }
      
      setGastos(prev => [...prev, gastoFormateado])
      setNewGasto({
        descripcion: "",
        monto: 0,
        categoria: "",
        fecha_gasto: new Date().toISOString().split('T')[0]
      })
      setCategoriaPersonalizada("")
      setIsCreateGastoDialogOpen(false)
    } catch (error) {
      console.error("❌ Error al crear gasto:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
    }
  }, [newGasto, categoriaPersonalizada])

  const handleEditGasto = useCallback(async () => {
    if (!selectedGasto || !editGasto.descripcion.trim() || !editGasto.categoria.trim() || editGasto.monto <= 0) return

    // Si la categoría es "otros", usar la categoría personalizada
    const categoriaFinal = editGasto.categoria === "otros" ? editCategoriaPersonalizada : editGasto.categoria
    if (editGasto.categoria === "otros" && !editCategoriaPersonalizada.trim()) return

    try {
      const response = await fetch(buildApiUrl(`/gastos-taller/${selectedGasto.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...editGasto, 
          categoria: categoriaFinal,
          fecha_gasto: new Date(editGasto.fecha_gasto).toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const gastoActualizado = await response.json()
      
      // Convertir al formato del frontend
      const gastoFormateado: GastoTaller = {
        id: gastoActualizado.id.toString(),
        descripcion: gastoActualizado.descripcion,
        monto: parseFloat(gastoActualizado.monto),
        categoria: gastoActualizado.categoria,
        fecha_gasto: gastoActualizado.fecha_gasto.split('T')[0],
        created_at: gastoActualizado.created_at,
        updated_at: gastoActualizado.updated_at
      }
      
      setGastos(prev => prev.map(gasto => 
        gasto.id === selectedGasto.id ? gastoFormateado : gasto
      ))
      setIsEditGastoDialogOpen(false)
      setSelectedGasto(null)
      setEditCategoriaPersonalizada("")
    } catch (error) {
      console.error("❌ Error al editar gasto:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
    }
  }, [selectedGasto, editGasto, editCategoriaPersonalizada])

  const handleDeleteGasto = useCallback(async () => {
    if (!selectedGasto) return

    try {
      const response = await fetch(buildApiUrl(`/gastos-taller/${selectedGasto.id}`), { 
        method: 'DELETE' 
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      setGastos(prev => prev.filter(gasto => gasto.id !== selectedGasto.id))
      setIsDeleteGastoDialogOpen(false)
      setSelectedGasto(null)
    } catch (error) {
      console.error("❌ Error al eliminar gasto:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
    }
  }, [selectedGasto])

  // Nueva función para verificar si es quincena (semana 2 o 4)
  const esQuincena = useCallback((semana: string) => {
    const resultado = semana === "2" || semana === "4"
    console.log("🔍 esQuincena:", { semana, resultado })
    return resultado
  }, [])

  // Funciones para pagos de salarios
  const handlePagoSalarios = useCallback(async () => {
    console.log("💵 handlePagoSalarios ejecutado:", nuevoPagoSalario)
    
    if (!nuevoPagoSalario.id_mecanico || nuevoPagoSalario.monto_salario <= 0) {
      console.log("❌ handlePagoSalarios: Datos inválidos")
      return
    }

    // Verificar si ya existe un pago para este mecánico en esta quincena
    const pagoExistente = verificarPagoExistente(
      nuevoPagoSalario.id_mecanico, 
      nuevoPagoSalario.semana_pago, 
      nuevoPagoSalario.fecha_pago
    )
    
    if (pagoExistente) {
      console.log("⚠️ Ya existe un pago para este mecánico en esta quincena:", pagoExistente)
      
      // Obtener el nombre del mecánico
      const mecanico = mecanicos.find(m => m.id === pagoExistente.id_mecanico)
      const nombreMecanico = mecanico ? mecanico.nombre : "Mecánico"
      
      // Configurar la información del pago duplicado para mostrar en el popup
      setPagoDuplicadoInfo({
        mecanico: nombreMecanico,
        semana: pagoExistente.semana_pago,
        fecha: pagoExistente.fecha_pago,
        monto: pagoExistente.monto_salario
      })
      
      // Mostrar el popup de alerta
      setShowPagoDuplicadoAlert(true)
      return
    }

    try {
             // Crear el pago de salario con el monto total (salario + comisiones aprobadas)
       const montoTotal = totalPagoConComision > 0 ? totalPagoConComision : nuevoPagoSalario.monto_salario
       
       const requestBody = {
         ...nuevoPagoSalario,
         monto_salario: montoTotal, // Usar el monto total en lugar del salario base
         fecha_pago: nuevoPagoSalario.fecha_pago // Enviar solo la fecha, no la hora
       }
       console.log("💵 Request body:", requestBody)
       
       const response = await fetch(buildApiUrl('/pagos-salarios'), {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(requestBody)
       })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const pagoCreado = await response.json()
      console.log("💵 Pago creado en la API:", pagoCreado)
      
      // Convertir al formato del frontend
      const pagoFormateado: PagoSalario = {
        id: pagoCreado.id.toString(),
        id_mecanico: pagoCreado.id_mecanico.toString(),
        nombre_mecanico: pagoCreado.nombre_mecanico || "Mecánico",
        monto_salario: parseFloat(pagoCreado.monto_salario),
        semana_pago: pagoCreado.semana_pago,
        fecha_pago: pagoCreado.fecha_pago.split('T')[0],
        created_at: pagoCreado.created_at
      }
      console.log("💵 Pago formateado:", pagoFormateado)
      
             // Si es quincena y hay comisiones PENDIENTES, marcarlas como aprobadas en la BD
       if (esQuincena(nuevoPagoSalario.semana_pago) && comisionesQuincena.length > 0) {
         try {
           console.log("💰 Procesando comisiones PENDIENTES para el pago...")
           
           // Marcar las comisiones como aprobadas en la base de datos
           const fechaPago = new Date(nuevoPagoSalario.fecha_pago)
           const año = fechaPago.getFullYear()
           const quincena = `${año}-Q${nuevoPagoSalario.semana_pago}`
           
           // Llamar a la API para aprobar las comisiones
           const responseComisiones = await fetch(`${buildApiUrl('/mecanicos')}/${nuevoPagoSalario.id_mecanico}/comisiones/quincena/${quincena}/estado`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({ aprobar: true })
           })
           
           if (responseComisiones.ok) {
             console.log("✅ Comisiones PENDIENTES marcadas como aprobadas exitosamente")
           } else {
             console.warn("⚠️ No se pudieron marcar las comisiones como aprobadas")
           }
           
           console.log("💰 Comisiones PENDIENTES incluidas en el pago:", {
             mecanicoId: nuevoPagoSalario.id_mecanico,
             semana: nuevoPagoSalario.semana_pago,
             totalComisiones: totalPagoConComision - nuevoPagoSalario.monto_salario,
             totalPago: totalPagoConComision
           })
           
         } catch (error) {
           console.error("Error al procesar comisiones:", error)
           // No fallar si hay error con las comisiones, solo loguear
         }
       } else {
         console.log("💰 No hay comisiones PENDIENTES para procesar:", {
           esQuincena: esQuincena(nuevoPagoSalario.semana_pago),
           comisionesLength: comisionesQuincena.length
         })
       }
      
      setPagosSalarios(prev => [...prev, pagoFormateado])
      console.log("💵 Pago agregado a la lista local")
      
      const nuevoEstado = {
        id_mecanico: "",
        monto_salario: 0,
        semana_pago: obtenerSemanaActual(),
        fecha_pago: new Date().toISOString().split('T')[0]
      }
      console.log("💵 Nuevo estado para nuevoPagoSalario:", nuevoEstado)
      setNuevoPagoSalario(nuevoEstado)
      
             // Actualizar estado de comisiones como aprobadas (todas las PENDIENTES se aprueban automáticamente)
       if (esQuincena(nuevoPagoSalario.semana_pago) && comisionesQuincena.length > 0) {
         const fechaPago = new Date(nuevoPagoSalario.fecha_pago)
         const año = fechaPago.getFullYear()
         const quincena = `${año}-Q${nuevoPagoSalario.semana_pago}`
         
         setEstadoQuincena({
           mecanicoId: nuevoPagoSalario.id_mecanico,
           quincena,
           estado: "APROBADA",
           totalComisiones: totalPagoConComision - nuevoPagoSalario.monto_salario
         })
       }
       
       // Limpiar estados de comisiones
       console.log("💵 Limpiando estados de comisiones")
       setComisionesQuincena([])
       setTotalPagoConComision(0)
      
      setIsPagoSalariosDialogOpen(false)
      console.log("💵 Dialog cerrado")
    } catch (error) {
      console.error("❌ Error al crear pago de salario:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
    }
  }, [nuevoPagoSalario, esQuincena, comisionesQuincena, totalPagoConComision, obtenerSemanaActual])

  // Función para cargar comisiones por quincena (solo PENDIENTES)
  const cargarComisionesQuincena = useCallback(async (mecanicoId: string, semana: string, fechaPago: string, montoSalario: number) => {
    console.log("🔍 Cargando comisiones PENDIENTES para:", { mecanicoId, semana, fechaPago, montoSalario })
    
    if (!esQuincena(semana)) {
      console.log("❌ No es quincena, limpiando comisiones")
      setComisionesQuincena([])
      setTotalPagoConComision(montoSalario)
      return
    }

    setLoadingComisiones(true)
    try {
      // Construir la quincena en formato YYYY-Q1, YYYY-Q2, etc.
      const fechaPagoObj = new Date(fechaPago)
      const año = fechaPagoObj.getFullYear()
      const quincena = `${año}-Q${semana}`
      
      console.log("💰 Obteniendo comisiones PENDIENTES del mecánico para quincena:", quincena)
      
      // Usar el endpoint que obtiene comisiones por quincena
      const url = buildApiUrl(`/mecanicos/${mecanicoId}/comisiones/quincena/${quincena}`)
      console.log("🌐 Llamando a la API:", url)
      
      const response = await fetch(url)
      console.log("📡 Status de la respuesta:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Error en la respuesta:", errorText)
        throw new Error(`Error al obtener comisiones: ${response.status} - ${errorText}`)
      }
      
      const comisiones = await response.json()
      console.log("📊 Comisiones recibidas de la API:", comisiones)
      
      if (comisiones.length === 0) {
        console.log("⚠️ No hay comisiones para este mecánico en esta quincena")
        setComisionesQuincena([])
        setTotalPagoConComision(montoSalario)
        setLoadingComisiones(false)
        return
      }
      
      // Convertir comisiones al formato esperado por el frontend
      const comisionesFormateadas = comisiones.map((comision: any) => ({
        id: comision.id.toString(),
        id_mecanico: mecanicoId,
        monto_comision: comision.monto_comision || 0,
        fecha_comision: comision.fecha_trabajo,
        descripcion_trabajo: comision.descripcion_trabajo,
        ganancia_base: 0,
        estado: comision.estado_comision
      }))
      
      // FILTRAR SOLO LAS COMISIONES PENDIENTES (excluir DENEGADAS, APROBADAS y PENALIZADAS)
      console.log("🔍 Comisiones antes del filtro:", comisionesFormateadas.map((c: ComisionQuincena) => ({
        id: c.id,
        estado: c.estado,
        monto: c.monto_comision
      })))
      
      const comisionesPendientes = comisionesFormateadas.filter(
        (comision: ComisionQuincena) => {
          const esPendiente = comision.estado === 'PENDIENTE'
          const tieneMonto = Number(comision.monto_comision) > 0
          const noEsDenegada = comision.estado !== 'DENEGADA'
          const resultado = esPendiente && tieneMonto && noEsDenegada
          
          console.log(`🔍 Comisión ${comision.id}: estado=${comision.estado}, monto=${comision.monto_comision}, esPendiente=${esPendiente}, tieneMonto=${tieneMonto}, noEsDenegada=${noEsDenegada}, resultado=${resultado}`)
          
          return resultado
        }
      )
      
      console.log("📊 Comisiones PENDIENTES filtradas:", comisionesPendientes)
      setComisionesQuincena(comisionesPendientes)
      
      const totalComisiones = comisionesPendientes.reduce((sum: number, comisionItem: ComisionQuincena) => {
        return sum + (Number(comisionItem.monto_comision) || 0)
      }, 0)
      
      console.log("💰 Total comisiones PENDIENTES:", totalComisiones)
      
      // Calcular total del pago (salario + comisiones PENDIENTES)
      const totalPago = montoSalario + totalComisiones
      setTotalPagoConComision(totalPago)
      
      console.log("💵 Total pago con comisiones PENDIENTES:", totalPago)
      
    } catch (error) {
      console.error("❌ Error al cargar comisiones por quincena:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error("❌ Error desconocido:", error)
      }
      setComisionesQuincena([])
      setTotalPagoConComision(montoSalario)
    } finally {
      setLoadingComisiones(false)
    }
  }, [esQuincena])

  // Función para debug de comisiones
  const debugComisiones = useCallback(async () => {
    if (!nuevoPagoSalario.id_mecanico) {
      console.error("❌ No hay mecánico seleccionado")
      return
    }

    try {
      console.log("🔍 Debug de comisiones para mecánico:", nuevoPagoSalario.id_mecanico)
      
      const response = await fetch(`${buildApiUrl('/mecanicos')}/${nuevoPagoSalario.id_mecanico}/comisiones/debug`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al hacer debug: ${response.status} - ${errorText}`)
      }

      const resultado = await response.json()
      console.log("🔍 Debug de comisiones:", resultado)

    } catch (error) {
      console.error("❌ Error al hacer debug:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      }
    }
  }, [nuevoPagoSalario.id_mecanico])

  // Función para asignar quincenas a comisiones pendientes
  const asignarQuincenasComisiones = useCallback(async () => {
    try {
      console.log("🔄 Asignando quincenas a comisiones pendientes...")
      
      const response = await fetch(`${buildApiUrl('/mecanicos')}/asignar-quincenas-comisiones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al asignar quincenas: ${response.status} - ${errorText}`)
      }

      const resultado = await response.json()
      console.log("✅ Resultado de asignación de quincenas:", resultado)
      
      // Recargar comisiones después de asignar quincenas
      if (nuevoPagoSalario.id_mecanico && nuevoPagoSalario.semana_pago) {
        await cargarComisionesQuincena(
          nuevoPagoSalario.id_mecanico, 
          nuevoPagoSalario.semana_pago, 
          nuevoPagoSalario.fecha_pago, 
          nuevoPagoSalario.monto_salario
        )
      }

    } catch (error) {
      console.error("❌ Error al asignar quincenas:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      }
    }
  }, [nuevoPagoSalario.id_mecanico, nuevoPagoSalario.semana_pago, nuevoPagoSalario.fecha_pago, nuevoPagoSalario.monto_salario, cargarComisionesQuincena])

  // Función para aprobar o denegar comisiones de quincena
  const aprobarDenegarComisionesQuincena = useCallback(async (aprobar: boolean) => {
    if (!nuevoPagoSalario.id_mecanico || !nuevoPagoSalario.semana_pago) {
      console.error("❌ No hay mecánico o semana seleccionada")
      return
    }

    try {
      setLoadingEstadoQuincena(true)
      console.log("🔄 Aprobando/Denegando comisiones PENDIENTES de quincena:", { aprobar })

      // Construir la quincena en formato YYYY-Q1, YYYY-Q2, etc.
      const fechaPago = new Date(nuevoPagoSalario.fecha_pago)
      const año = fechaPago.getFullYear()
      const quincena = `${año}-Q${nuevoPagoSalario.semana_pago}`

      const response = await fetch(`${buildApiUrl('/mecanicos')}/${nuevoPagoSalario.id_mecanico}/comisiones/quincena/${quincena}/estado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "aprobar": aprobar })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al procesar comisiones: ${response.status} - ${errorText}`)
      }

      const resultado = await response.json()
      console.log("✅ Resultado de aprobación/denegación:", resultado)

      if (aprobar) {
        // Si se aprueban, mantener las comisiones PENDIENTES y calcular el total
        const totalComisiones = comisionesQuincena.reduce((sum, comision) => sum + (Number(comision.monto_comision) || 0), 0)
        setTotalPagoConComision(nuevoPagoSalario.monto_salario + totalComisiones)
        setEstadoQuincena({
          mecanicoId: nuevoPagoSalario.id_mecanico,
          quincena,
          estado: "APROBADA",
          totalComisiones
        })
      } else {
        // Si se deniegan, limpiar comisiones inmediatamente para feedback visual
        setComisionesQuincena([])
        setTotalPagoConComision(nuevoPagoSalario.monto_salario)
        setEstadoQuincena({
          mecanicoId: nuevoPagoSalario.id_mecanico,
          quincena,
          estado: "DENEGADA",
          totalComisiones: 0
        })
        
        // Mostrar mensaje de confirmación
        setMensajeDenegacion("✅ Comisiones denegadas exitosamente. Solo se afectaron las comisiones del mecánico específico.")
        console.log("✅ Comisiones denegadas exitosamente. Solo se afectaron las comisiones del mecánico específico.")
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setMensajeDenegacion(null)
        }, 3000)
      }

    } catch (error) {
      console.error("❌ Error al aprobar/denegar comisiones:", error)
      if (error instanceof Error) {
        console.error("❌ Detalles del error:", {
          message: error.message,
          stack: error.stack
        })
      }
    } finally {
      setLoadingEstadoQuincena(false)
    }
  }, [nuevoPagoSalario.id_mecanico, nuevoPagoSalario.semana_pago, nuevoPagoSalario.fecha_pago, nuevoPagoSalario.monto_salario, comisionesQuincena])

  // Cargar comisiones automáticamente cuando se abra el diálogo de pagos
  useEffect(() => {
    console.log("🎯 useEffect isPagoSalariosDialogOpen ejecutado:", {
      isPagoSalariosDialogOpen,
      id_mecanico: nuevoPagoSalario.id_mecanico,
      semana_pago: nuevoPagoSalario.semana_pago
    })
    
    if (isPagoSalariosDialogOpen && nuevoPagoSalario.id_mecanico && nuevoPagoSalario.semana_pago) {
      console.log("🎯 Dialog abierto, cargando comisiones automáticamente")
      cargarComisionesQuincena(nuevoPagoSalario.id_mecanico, nuevoPagoSalario.semana_pago, nuevoPagoSalario.fecha_pago, nuevoPagoSalario.monto_salario)
    }
  }, [isPagoSalariosDialogOpen, nuevoPagoSalario.id_mecanico, nuevoPagoSalario.semana_pago, cargarComisionesQuincena])

  // Cargar comisiones cuando cambie la fecha del pago (solo si es necesario)
  useEffect(() => {
    // Solo ejecutar si el diálogo está abierto y tenemos todos los datos necesarios
    if (isPagoSalariosDialogOpen && 
        nuevoPagoSalario.id_mecanico && 
        nuevoPagoSalario.semana_pago && 
        esQuincena(nuevoPagoSalario.semana_pago)) {
      
      console.log("📅 Fecha del pago cambiada, recargando comisiones")
      cargarComisionesQuincena(
        nuevoPagoSalario.id_mecanico, 
        nuevoPagoSalario.semana_pago, 
        nuevoPagoSalario.fecha_pago, 
        nuevoPagoSalario.monto_salario
      )
    }
  }, [nuevoPagoSalario.fecha_pago, isPagoSalariosDialogOpen, nuevoPagoSalario.id_mecanico, nuevoPagoSalario.semana_pago, esQuincena, cargarComisionesQuincena])

  // Funciones auxiliares
  const openViewGastoDialog = useCallback((gasto: GastoTaller) => {
    setSelectedGasto(gasto)
    setIsViewGastoDialogOpen(true)
  }, [])

  const openEditGastoDialog = useCallback((gasto: GastoTaller) => {
    setSelectedGasto(gasto)
    setEditGasto({
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      categoria: gasto.categoria,
      fecha_gasto: gasto.fecha_gasto
    })
    
    // Si la categoría no está en las predefinidas, es una categoría personalizada
    const categoriaPredefinida = categoriasGastos.find(cat => cat.value === gasto.categoria)
    if (categoriaPredefinida) {
      setEditCategoriaPersonalizada("")
    } else {
      setEditGasto(prev => ({ ...prev, categoria: "otros" }))
      setEditCategoriaPersonalizada(gasto.categoria)
    }
    
    setIsEditGastoDialogOpen(true)
  }, [categoriasGastos])

  const openDeleteGastoDialog = useCallback((gasto: GastoTaller) => {
    setSelectedGasto(gasto)
    setIsDeleteGastoDialogOpen(true)
  }, [])

  const getCategoriaIcon = useCallback((categoria: string) => {
    const cat = categoriasGastos.find(c => c.value === categoria)
    return cat ? cat.icon : Wrench
  }, [categoriasGastos])

  const getCategoriaLabel = useCallback((categoria: string) => {
    const cat = categoriasGastos.find(c => c.value === categoria)
    return cat ? cat.label : categoria
  }, [categoriasGastos])

  return (
    <div className="space-y-6 p-6">
      {/* ======================================== */}
      {/* SELECTOR DE PERIODO TEMPORAL COMPACTO */}
      {/* ======================================== */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Título y controles en línea */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Período:</span>
              </div>
              
              {/* Selector de Año */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value))
                  verificarPeriodoActual()
                }}
                className="px-2 py-1 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              {/* Selector de Mes */}
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value))
                  verificarPeriodoActual()
                }}
                className="px-2 py-1 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value={0}>Ene</option>
                <option value={1}>Feb</option>
                <option value={2}>Mar</option>
                <option value={3}>Abr</option>
                <option value={4}>May</option>
                <option value={5}>Jun</option>
                <option value={6}>Jul</option>
                <option value={7}>Ago</option>
                <option value={8}>Sep</option>
                <option value={9}>Oct</option>
                <option value={10}>Nov</option>
                <option value={11}>Dic</option>
              </select>
              
              {/* Botón Mes Actual */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const fechaActual = new Date()
                  setSelectedYear(fechaActual.getFullYear())
                  setSelectedMonth(fechaActual.getMonth())
                  verificarPeriodoActual()
                }}
                className="h-7 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Actual
              </Button>
            </div>
            
            {/* Información del período y estado */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500">Período</p>
                <p className="text-sm font-medium text-slate-700">
                  {new Date(selectedYear, selectedMonth).toLocaleDateString('es-CR', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              
              {/* Indicador de estado */}
              {!isCurrentPeriod ? (
                <Badge className="bg-amber-100 text-amber-800 text-xs px-2 py-1">
                  Histórico
                </Badge>
              ) : esFinDeMes() ? (
                <Badge className="bg-red-100 text-red-800 text-xs px-2 py-1 animate-pulse">
                  🔄 Fin de Mes
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                  Actual
                </Badge>
              )}
              
              <div className="text-right">
                <p className="text-xs text-slate-500">Registros</p>
                <p className="text-sm font-bold text-slate-700">
                  {gastos.length + pagosSalarios.length}
                </p>
              </div>
            </div>
                     </div>
           
           {/* Mensaje de fin de mes */}
           {isCurrentPeriod && esFinDeMes() && (
             <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
               <div className="flex items-center gap-2 text-red-700">
                 <RefreshCw className="h-4 w-4 animate-spin" />
                 <span className="text-sm font-medium">
                   🎯 Fin de mes detectado - Los datos se reiniciarán automáticamente al nuevo mes
                 </span>
               </div>
               <p className="text-xs text-red-600 mt-1">
                 Las listas se mostrarán vacías para el nuevo período, pero todos los datos históricos se mantienen en la base de datos
               </p>
             </div>
           )}
         </CardContent>
       </Card>

      {/* ======================================== */}
      {/* TARJETA: ESTADÍSTICAS PRINCIPALES */}
      {/* ======================================== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Gastos</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 mb-1">₡{statsCombinadas.totalGastosCombinados.toLocaleString()}</div>
            <p className="text-xs text-blue-700">
              Gastos del taller + Salarios totales
            </p>
            {!isCurrentPeriod && (
              <p className="text-xs text-blue-600 mt-1 font-medium">
                {new Date(selectedYear, selectedMonth).toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Gastos del Mes</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 mb-1">₡{statsCombinadas.totalMesCombinado.toLocaleString()}</div>
            <p className="text-xs text-green-700">
              {statsGastosTaller.gastosMes + statsSalarios.pagosMes} registros este mes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Salarios del Mes</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 mb-1">₡{statsSalarios.totalMes.toLocaleString()}</div>
            <p className="text-xs text-purple-700">
              {statsSalarios.pagosMes} pagos este mes
            </p>
          </CardContent>
        </Card>
      </div>

            {/* ======================================== */}
      {/* TARJETA: GASTOS DEL TALLER / PAGOS DE SALARIOS */}
      {/* ======================================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {mostrarGastos ? (
              <>
                <Wrench className="h-4 w-4 text-blue-600" />
                Gastos del Taller
              </>
            ) : (
              <>
                <Users className="h-4 w-4 text-green-600" />
                Pagos de Salarios
              </>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Botón para alternar entre gastos y pagos */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarGastos(!mostrarGastos)}
              className="text-xs"
            >
              {mostrarGastos ? (
                <>
                  <Users className="h-3 w-3 mr-1" />
                  Ver Salarios
                </>
              ) : (
                <>
                  <Wrench className="h-3 w-3 mr-1" />
                  Ver Gastos
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={cargarDatos}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Actualizar
            </Button>
            
            {mostrarGastos ? (
              <Button
                onClick={() => setIsCreateGastoDialogOpen(true)}
                size="sm"
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Nuevo Gasto
              </Button>
            ) : (
              <Button
                onClick={() => setIsPagoSalariosDialogOpen(true)}
                size="sm"
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Pagar Salarios
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* CONTENIDO DE GASTOS */}
          {mostrarGastos && (
            <>
              <div className="flex items-center py-4">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Buscar gastos..."
                  value={searchTermGastos}
                  onChange={(e) => setSearchTermGastos(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {loadingGastos ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-lg">Cargando gastos...</span>
                </div>
              ) : errorGastos ? (
                <ErrorMessage error={new Error(errorGastos)} />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGastos.map((gasto) => {
                        const CategoriaIcon = getCategoriaIcon(gasto.categoria)
                        return (
                          <TableRow key={gasto.id}>
                            <TableCell className="max-w-xs truncate">
                              {gasto.descripcion}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <CategoriaIcon className="h-3 w-3" />
                                {getCategoriaLabel(gasto.categoria)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-red-600">
                              ₡{gasto.monto.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {new Date(gasto.fecha_gasto).toLocaleDateString('es-CR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openViewGastoDialog(gasto)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openEditGastoDialog(gasto)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => openDeleteGastoDialog(gasto)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {filteredGastos.length === 0 && !loadingGastos && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTermGastos ? "No se encontraron gastos con esa búsqueda" : "No hay gastos registrados"}
                </div>
              )}
            </>
          )}

          {/* CONTENIDO DE PAGOS DE SALARIOS */}
          {!mostrarGastos && (
            <>
              {loadingPagos ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-lg">Cargando pagos...</span>
                </div>
              ) : errorPagos ? (
                <ErrorMessage error={new Error(errorPagos)} />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mecánico</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Semana</TableHead>
                        <TableHead>Fecha Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagosSalarios.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell className="font-medium">
                            {pago.nombre_mecanico}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            ₡{pago.monto_salario.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {pago.semana_pago}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(pago.fecha_pago).toLocaleDateString('es-CR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {pagosSalarios.length === 0 && !loadingPagos && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg">No hay pagos de salarios registrados</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Haz clic en "Pagar Salarios" para registrar el primer pago
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      

      {/* ======================================== */}
      {/* DIALOGOS */}
      {/* ======================================== */}

      {/* Dialog para crear nuevo gasto */}
      <Dialog open={isCreateGastoDialogOpen} onOpenChange={setIsCreateGastoDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Gasto del Taller</DialogTitle>
            <DialogDescription>
              Registra un nuevo gasto general del taller
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={newGasto.descripcion}
                onChange={(e) => setNewGasto(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Ej: Pago de luz del mes"
              />
            </div>
                         <div>
               <Label htmlFor="categoria">Categoría</Label>
               <select
                 id="categoria"
                 value={newGasto.categoria}
                 onChange={(e) => setNewGasto(prev => ({ ...prev, categoria: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Seleccionar categoría</option>
                 {categoriasGastos.map((cat) => (
                   <option key={cat.value} value={cat.value}>
                     {cat.label}
                   </option>
                 ))}
               </select>
             </div>
             
             {/* Campo para categoría personalizada */}
             {newGasto.categoria === "otros" && (
               <div>
                 <Label htmlFor="categoria_personalizada">Especificar Categoría</Label>
                 <Input
                   id="categoria_personalizada"
                   value={categoriaPersonalizada}
                   onChange={(e) => setCategoriaPersonalizada(e.target.value)}
                   placeholder="Ej: Mantenimiento, Limpieza, etc."
                 />
               </div>
             )}
                         <div>
               <Label htmlFor="monto">Monto (₡)</Label>
               <Input
                 id="monto"
                 type="number"
                 value={newGasto.monto === 0 ? "" : newGasto.monto}
                 onChange={(e) => setNewGasto(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                 placeholder="0.00"
                 min="0"
                 step="0.01"
               />
             </div>
            <div>
              <Label htmlFor="fecha_gasto">Fecha del Gasto</Label>
              <Input
                id="fecha_gasto"
                type="date"
                value={newGasto.fecha_gasto}
                onChange={(e) => setNewGasto(prev => ({ ...prev, fecha_gasto: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGastoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGasto}>
              Crear Gasto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para pagar salarios */}
      <Dialog open={isPagoSalariosDialogOpen} onOpenChange={setIsPagoSalariosDialogOpen}>
        <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pagar Salarios</DialogTitle>
            <DialogDescription>
              Registra el pago de salarios semanales a los mecánicos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mecanico">Mecánico</Label>
              <select
                id="mecanico"
                value={nuevoPagoSalario.id_mecanico}
                                 onChange={(e) => {
                   const mecanicoId = e.target.value
                   console.log("👤 Mecánico seleccionado:", mecanicoId)
                   setNuevoPagoSalario(prev => ({ ...prev, id_mecanico: mecanicoId }))
                   // Cargar comisiones si es quincena
                   if (mecanicoId && nuevoPagoSalario.semana_pago) {
                     console.log("🚀 Llamando cargarComisionesQuincena desde onChange del mecánico")
                     console.log("🚀 Parámetros:", { mecanicoId, semana: nuevoPagoSalario.semana_pago })
                     cargarComisionesQuincena(mecanicoId, nuevoPagoSalario.semana_pago, nuevoPagoSalario.fecha_pago, nuevoPagoSalario.monto_salario)
                   }
                 }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar mecánico</option>
                {mecanicos.map((mecanico) => (
                  <option key={mecanico.id} value={mecanico.id}>
                    {mecanico.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="monto_salario">Monto del Salario (₡)</Label>
              <Input
                id="monto_salario"
                type="number"
                value={nuevoPagoSalario.monto_salario === 0 ? "" : nuevoPagoSalario.monto_salario}
                onChange={(e) => {
                  const monto = parseFloat(e.target.value) || 0
                  setNuevoPagoSalario(prev => ({ ...prev, monto_salario: monto }))
                  
                  // Recalcular total con comisiones PENDIENTES
                  if (comisionesQuincena.length > 0) {
                    const totalComisiones = comisionesQuincena
                      .reduce((sum, comision: ComisionQuincena) => {
                        return sum + (Number(comision.monto_comision) || 0)
                      }, 0)
                    setTotalPagoConComision(monto + totalComisiones)
                  } else {
                    setTotalPagoConComision(monto)
                  }
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="semana_pago">Semana de Pago</Label>
              <select
                id="semana_pago"
                value={nuevoPagoSalario.semana_pago}
                                 onChange={(e) => {
                   const semana = e.target.value
                   console.log("📅 Semana seleccionada:", semana)
                   setNuevoPagoSalario(prev => ({ ...prev, semana_pago: semana }))
                   // Cargar comisiones si es quincena y hay mecánico seleccionado
                   if (nuevoPagoSalario.id_mecanico && semana) {
                     console.log("🚀 Llamando cargarComisionesQuincena desde onChange de la semana")
                     console.log("🚀 Parámetros:", { mecanicoId: nuevoPagoSalario.id_mecanico, semana })
                     cargarComisionesQuincena(nuevoPagoSalario.id_mecanico, semana, nuevoPagoSalario.fecha_pago, nuevoPagoSalario.monto_salario)
                   }
                 }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar semana</option>
                <option value="1">Semana 1</option>
                <option value="2">Semana 2 (Quincena 1)</option>
                <option value="3">Semana 3</option>
                <option value="4">Semana 4 (Quincena 2)</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="fecha_pago">Fecha del Pago</Label>
                             <Input
                 id="fecha_pago"
                 type="date"
                 value={nuevoPagoSalario.fecha_pago}
                 onChange={(e) => {
                   const nuevaFecha = e.target.value
                   console.log("📅 Fecha cambiada:", nuevaFecha)
                   setNuevoPagoSalario(prev => ({ ...prev, fecha_pago: nuevaFecha }))
                 }}
               />
            </div>

            {/* Sección de Comisiones por Quincena */}
            {nuevoPagoSalario.id_mecanico && esQuincena(nuevoPagoSalario.semana_pago) && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <Label className="text-green-700 font-semibold">Comisiones por Quincena</Label>
                  </div>
                  
                  {/* Botón de debug para probar la API */}
                                     <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       console.log("🧪 Botón de debug presionado")
                       console.log("🧪 Estado actual:", {
                         id_mecanico: nuevoPagoSalario.id_mecanico,
                         semana_pago: nuevoPagoSalario.semana_pago,
                         fecha_pago: nuevoPagoSalario.fecha_pago
                       })
                       if (nuevoPagoSalario.id_mecanico && nuevoPagoSalario.semana_pago) {
                         console.log("🧪 Llamando cargarComisionesQuincena desde botón Recargar")
                         cargarComisionesQuincena(nuevoPagoSalario.id_mecanico, nuevoPagoSalario.semana_pago, nuevoPagoSalario.fecha_pago, nuevoPagoSalario.monto_salario)
                       } else {
                         console.log("🧪 No se puede cargar - faltan datos:", {
                           tieneMecanico: !!nuevoPagoSalario.id_mecanico,
                           tieneSemana: !!nuevoPagoSalario.semana_pago
                         })
                       }
                     }}
                     className="text-xs h-6 px-2"
                   >
                     🔄 Recargar
                   </Button>
                </div>
                
                {loadingComisiones ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <LoadingSpinner size="sm" />
                    Calculando comisiones...
                  </div>
                ) : comisionesQuincena.length > 0 ? (
                  <div className="space-y-3">
                    {/* Resumen de comisiones */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-700">Total Comisiones de la Quincena:</span>
                        <span className="font-semibold text-blue-800">
                          ₡{comisionesQuincena
                            .reduce((sum, comision) => sum + (Number(comision.monto_comision) || 0), 0)
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {comisionesQuincena.length} comisiones generadas
                      </div>
                    </div>

                    {/* Botones de aprobación/denegación */}
                    {/* Botones de debug y asignación */}
                    <div className="flex gap-2 mb-2">
                      <Button
                        onClick={debugComisiones}
                        variant="outline"
                        className="flex-1"
                      >
                        🔍 Debug Comisiones
                      </Button>
                      <Button
                        onClick={asignarQuincenasComisiones}
                        variant="outline"
                        className="flex-1"
                      >
                        🔧 Asignar Quincenas
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => aprobarDenegarComisionesQuincena(true)}
                        disabled={loadingEstadoQuincena}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {loadingEstadoQuincena ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "✅ Aprobar Comisiones"
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowConfirmDenegar(true)}
                        disabled={loadingEstadoQuincena}
                        variant="destructive"
                        className="flex-1"
                      >
                        {loadingEstadoQuincena ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "❌ Denegar Comisiones"
                        )}
                      </Button>
                    </div>

                    {/* Estado actual */}
                    {estadoQuincena && (
                      <div className={`p-2 rounded-lg text-sm text-center ${
                        estadoQuincena.estado === "APROBADA" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        <strong>Estado:</strong> {estadoQuincena.estado === "APROBADA" ? "APROBADA" : "DENEGADA"}
                        {estadoQuincena.estado === "DENEGADA" && (
                          <div className="mt-2">
                            <p>Las comisiones han sido eliminadas</p>
                            <p className="text-xs text-blue-600 mt-1">
                              💡 Puedes registrar el pago del salario base normalmente
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lista de comisiones (solo para visualización) */}
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {comisionesQuincena.map((comision) => (
                        <div key={comision.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                          <div className="flex-1">
                            <div className="text-gray-600">
                              {new Date(comision.fecha_comision).toLocaleDateString()}
                            </div>
                            <div className="text-gray-500 text-xs truncate max-w-32">
                              {comision.descripcion_trabajo}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-gray-700">
                              ₡{Number(comision.monto_comision).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      No hay comisiones pendientes para esta quincena
                    </div>
                    
                    {/* Información de debug */}
                    <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded border">
                      <div><strong>Debug Info:</strong></div>
                      <div>Mecánico ID: {nuevoPagoSalario.id_mecanico}</div>
                      <div>Semana: {nuevoPagoSalario.semana_pago}</div>
                      <div>Fecha del Pago: {nuevoPagoSalario.fecha_pago}</div>
                      <div>Mes del Pago: {new Date(nuevoPagoSalario.fecha_pago).getMonth()} ({new Date(nuevoPagoSalario.fecha_pago).toLocaleDateString('es-CR', { month: 'long' })})</div>
                      <div>Año del Pago: {new Date(nuevoPagoSalario.fecha_pago).getFullYear()}</div>
                      <div>¿Es quincena?: {esQuincena(nuevoPagoSalario.semana_pago) ? 'Sí' : 'No'}</div>
                      <div>Estado loading: {loadingComisiones ? 'Sí' : 'No'}</div>
                    </div>
                  </div>
                )}
                
                                 {/* Total del Pago (Salario + Comisiones PENDIENTES) */}
                 <div className="border-t pt-3">
                   <div className="flex justify-between items-center text-lg font-semibold text-blue-700 bg-blue-50 p-3 rounded-lg">
                     <span>Total a Pagar:</span>
                     <span>₡{totalPagoConComision.toLocaleString()}</span>
                   </div>
                   <div className="text-xs text-gray-500 mt-1">
                     Salario Base: ₡{nuevoPagoSalario.monto_salario.toLocaleString()} + 
                     Comisiones PENDIENTES: ₡{(totalPagoConComision - nuevoPagoSalario.monto_salario).toLocaleString()}
                   </div>
                   <div className="text-xs text-green-600 mt-1 font-medium">
                     💡 Al registrar el pago, las comisiones PENDIENTES se marcarán como APROBADAS
                   </div>
                 </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPagoSalariosDialogOpen(false)
              // Limpiar estados de comisiones
              setComisionesQuincena([])
              setTotalPagoConComision(0)
            }}>
              Cancelar
            </Button>
            <Button onClick={handlePagoSalarios}>
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup de confirmación para denegar comisiones */}
      <AlertDialog open={showConfirmDenegar} onOpenChange={setShowConfirmDenegar}>
        <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-xl max-w-md mx-auto">
          <div className="p-6">
            {/* Header con ícono */}
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            {/* Título */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Denegar Comisiones
            </h3>
            
            {/* Mensaje principal */}
            <p className="text-gray-600 text-center mb-6">
              ¿Estás seguro de que quieres denegar las comisiones de esta quincena?
            </p>
            
            {/* Advertencia */}
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 font-medium">Advertencia</p>
                  <p className="text-sm text-red-700 mt-1">
                    Al denegar las comisiones, se eliminarán permanentemente de la base de datos y no se podrán recuperar.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800 font-medium">Información</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Después de denegar las comisiones, podrás registrar el pago del salario base sin problemas.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDenegar(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowConfirmDenegar(false)
                  aprobarDenegarComisionesQuincena(false)
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Denegar Comisiones
              </button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mensaje de confirmación de denegación */}
      {mensajeDenegacion && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg border-l-4 border-green-400">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">{mensajeDenegacion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dialog para ver gasto */}
      <Dialog open={isViewGastoDialogOpen} onOpenChange={setIsViewGastoDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Gasto</DialogTitle>
          </DialogHeader>
          {selectedGasto && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900">ID del Gasto</p>
                <p className="text-lg font-mono text-blue-700">#{selectedGasto.id}</p>
              </div>

              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Descripción</p>
                  <p className="text-lg">{selectedGasto.descripcion}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Categoría</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const CategoriaIcon = getCategoriaIcon(selectedGasto.categoria)
                      return (
                        <>
                          <CategoriaIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-lg">{getCategoriaLabel(selectedGasto.categoria)}</span>
                        </>
                      )
                    })()}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Monto</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-600" />
                    <span className="text-lg font-semibold text-red-600">
                      ₡{selectedGasto.monto.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha del Gasto</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span>{new Date(selectedGasto.fecha_gasto).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewGastoDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar gasto */}
      <Dialog open={isEditGastoDialogOpen} onOpenChange={setIsEditGastoDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Gasto del Taller</DialogTitle>
            <DialogDescription>
              Modifica la información del gasto seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_descripcion">Descripción</Label>
              <Input
                id="edit_descripcion"
                value={editGasto.descripcion}
                onChange={(e) => setEditGasto(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Ej: Pago de luz del mes"
              />
            </div>
                         <div>
               <Label htmlFor="edit_categoria">Categoría</Label>
               <select
                 id="edit_categoria"
                 value={editGasto.categoria}
                 onChange={(e) => setEditGasto(prev => ({ ...prev, categoria: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Seleccionar categoría</option>
                 {categoriasGastos.map((cat) => (
                   <option key={cat.value} value={cat.value}>
                     {cat.label}
                   </option>
                 ))}
               </select>
             </div>
             
             {/* Campo para categoría personalizada */}
             {editGasto.categoria === "otros" && (
               <div>
                 <Label htmlFor="edit_categoria_personalizada">Especificar Categoría</Label>
                 <Input
                   id="edit_categoria_personalizada"
                   value={editCategoriaPersonalizada}
                   onChange={(e) => setEditCategoriaPersonalizada(e.target.value)}
                   placeholder="Ej: Mantenimiento, Limpieza, etc."
                 />
               </div>
             )}
                         <div>
               <Label htmlFor="edit_monto">Monto (₡)</Label>
               <Input
                 id="edit_monto"
                 type="number"
                 value={editGasto.monto === 0 ? "" : editGasto.monto}
                 onChange={(e) => setEditGasto(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                 placeholder="0.00"
                 min="0"
                 step="0.01"
               />
             </div>
            <div>
              <Label htmlFor="edit_fecha_gasto">Fecha del Gasto</Label>
              <Input
                id="edit_fecha_gasto"
                type="date"
                value={editGasto.fecha_gasto}
                onChange={(e) => setEditGasto(prev => ({ ...prev, fecha_gasto: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGastoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditGasto}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <AlertDialog open={isDeleteGastoDialogOpen} onOpenChange={setIsDeleteGastoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el gasto:
              <br />
              <strong>{selectedGasto?.descripcion}</strong>
              <br />
              <strong>₡{selectedGasto?.monto.toLocaleString()}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGasto} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Popup de alerta para pago duplicado */}
      <AlertDialog open={showPagoDuplicadoAlert} onOpenChange={setShowPagoDuplicadoAlert}>
        <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-xl max-w-lg mx-auto">
          <div className="p-6">
            {/* Header con ícono */}
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            {/* Título */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Pago Ya Registrado
            </h3>
            
            {/* Mensaje principal */}
            <p className="text-gray-600 text-center mb-6">
              Ya se ha registrado un pago para este mecánico en esta quincena
            </p>
            
            {/* Información del pago duplicado */}
            {pagoDuplicadoInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mecánico</p>
                      <p className="text-sm font-semibold text-gray-900">{pagoDuplicadoInfo.mecanico}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Semana</p>
                      <p className="text-sm font-semibold text-gray-900">Semana {pagoDuplicadoInfo.semana}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha del Pago</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(pagoDuplicadoInfo.fecha).toLocaleDateString('es-CR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monto Pagado</p>
                      <p className="text-lg font-bold text-green-600">
                        ₡{pagoDuplicadoInfo.monto.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Información del sistema */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800 font-medium">¿Por qué no se permite?</p>
                  <p className="text-sm text-blue-700 mt-1">
                    El sistema evita duplicaciones y mantiene la integridad de los datos financieros.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Botón de acción */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowPagoDuplicadoAlert(false)}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
