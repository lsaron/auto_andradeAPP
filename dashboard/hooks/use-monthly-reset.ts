import { useState, useEffect, useCallback } from 'react'

interface MonthlyResetConfig {
  autoReset?: boolean // Si se debe hacer reset automático
  resetDay?: number // Día del mes para el reset (por defecto 1)
  preserveHistory?: boolean // Si se debe preservar el historial
}

interface MonthlyResetState {
  currentMonth: number
  currentYear: number
  lastResetDate: Date | null
  isNewMonth: boolean
  shouldReset: boolean
}

export function useMonthlyReset(config: MonthlyResetConfig = {}) {
  const {
    autoReset = true,
    resetDay = 1,
    preserveHistory = true
  } = config

  const [state, setState] = useState<MonthlyResetState>({
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    lastResetDate: null,
    isNewMonth: false,
    shouldReset: false
  })

  // Función para verificar si es un nuevo mes
  const checkNewMonth = useCallback(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const currentDay = now.getDate()
    
    // Verificar si es el día de reset del mes
    const isResetDay = currentDay === resetDay
    
    // Verificar si es un nuevo mes
    const isNewMonth = currentMonth !== state.currentMonth || currentYear !== state.currentYear
    
    // Verificar si se debe hacer reset
    const shouldReset = autoReset && isResetDay && isNewMonth
    
    setState(prev => ({
      currentMonth,
      currentYear,
      lastResetDate: shouldReset ? now : prev.lastResetDate,
      isNewMonth,
      shouldReset
    }))
    
    return { isNewMonth, shouldReset, isResetDay }
  }, [state.currentMonth, state.currentYear, resetDay, autoReset])

  // Función para verificar si es lunes de inicio de mes
  const isMondayStartOfMonth = useCallback(() => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Domingo, 1 = Lunes
    const dayOfMonth = now.getDate()
    
    // Es lunes (1) y es el primer día del mes o el día de reset
    return dayOfWeek === 1 && (dayOfMonth === 1 || dayOfMonth === resetDay)
  }, [resetDay])

  // Función para obtener la fecha del próximo reset
  const getNextResetDate = useCallback(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Si ya pasó el día de reset este mes, el próximo reset es el próximo mes
    if (now.getDate() >= resetDay) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
      return new Date(nextYear, nextMonth, resetDay)
    } else {
      // El próximo reset es este mes
      return new Date(currentYear, currentMonth, resetDay)
    }
  }, [resetDay])

  // Función para formatear la fecha del próximo reset
  const getFormattedNextReset = useCallback(() => {
    const nextReset = getNextResetDate()
    return nextReset.toLocaleDateString('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [getNextResetDate])

  // Función para verificar si se debe mostrar el banner de reset
  const shouldShowResetBanner = useCallback(() => {
    const now = new Date()
    const nextReset = getNextResetDate()
    const daysUntilReset = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Mostrar banner si faltan 3 días o menos para el reset
    return daysUntilReset <= 3
  }, [getNextResetDate])

  // Función para ejecutar el reset manualmente
  const executeReset = useCallback(() => {
    const now = new Date()
    setState(prev => ({
      ...prev,
      lastResetDate: now,
      shouldReset: false,
      isNewMonth: false
    }))
    
    // Disparar evento personalizado para que otros componentes sepan que se hizo reset
    window.dispatchEvent(new CustomEvent('monthlyReset', {
      detail: {
        resetDate: now,
        month: now.getMonth(),
        year: now.getFullYear()
      }
    }))
  }, [])

  // Verificar nuevo mes cada minuto
  useEffect(() => {
    if (!autoReset) return

    const interval = setInterval(() => {
      checkNewMonth()
    }, 60000) // Cada minuto

    return () => clearInterval(interval)
  }, [autoReset, checkNewMonth])

  // Verificar al montar el componente
  useEffect(() => {
    checkNewMonth()
  }, [checkNewMonth])

  // Verificar si es lunes de inicio de mes cada hora
  useEffect(() => {
    if (!autoReset) return

    const interval = setInterval(() => {
      if (isMondayStartOfMonth()) {
        console.log('🔄 Lunes de inicio de mes detectado - Ejecutando reset automático')
        executeReset()
      }
    }, 3600000) // Cada hora

    return () => clearInterval(interval)
  }, [autoReset, isMondayStartOfMonth, executeReset])

  return {
    ...state,
    isMondayStartOfMonth: isMondayStartOfMonth(),
    getNextResetDate,
    getFormattedNextReset,
    shouldShowResetBanner: shouldShowResetBanner(),
    executeReset,
    checkNewMonth
  }
}
