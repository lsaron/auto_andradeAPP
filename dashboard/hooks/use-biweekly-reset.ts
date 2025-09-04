import { useState, useEffect, useCallback } from 'react'

interface BiweeklyResetConfig {
  autoReset?: boolean // Si se debe hacer reset automático
  preserveHistory?: boolean // Si se debe preservar el historial
}

interface BiweeklyResetState {
  currentQuincena: number // 1 o 2
  currentMonth: number
  currentYear: number
  lastResetDate: Date | null
  isNewQuincena: boolean
  shouldReset: boolean
}

export function useBiweeklyReset(config: BiweeklyResetConfig = {}) {
  const {
    autoReset = true,
    preserveHistory = true
  } = config

  const [state, setState] = useState<BiweeklyResetState>({
    currentQuincena: getCurrentQuincena(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    lastResetDate: null,
    isNewQuincena: false,
    shouldReset: false
  })

  // Función para obtener la quincena actual (1 o 2)
  function getCurrentQuincena(): number {
    const now = new Date()
    const day = now.getDate()
    return day <= 15 ? 1 : 2
  }

  // Función para verificar si es domingo de fin de quincena
  const isSundayEndOfQuincena = useCallback(() => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Domingo, 1 = Lunes
    const dayOfMonth = now.getDate()
    
    // Es domingo (0) y es el último domingo de la quincena
    if (dayOfWeek !== 0) return false
    
    const currentQuincena = getCurrentQuincena()
    
    // Para la primera quincena (1-15), el último domingo es el 15 o antes
    if (currentQuincena === 1) {
      return dayOfMonth <= 15
    }
    
    // Para la segunda quincena (16-31), el último domingo es el 31 o antes
    return dayOfMonth <= 31
  }, [])

  // Función para verificar si es lunes de inicio de quincena
  const isMondayStartOfQuincena = useCallback(() => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Domingo, 1 = Lunes
    const dayOfMonth = now.getDate()
    
    // Es lunes (1) y es el primer día de la quincena
    if (dayOfWeek !== 1) return false
    
    // Lunes 1 (primera quincena) o Lunes 16 (segunda quincena)
    return dayOfMonth === 1 || dayOfMonth === 16
  }, [])

  // Función para verificar si es una nueva quincena
  const checkNewQuincena = useCallback(() => {
    const now = new Date()
    const currentQuincena = getCurrentQuincena()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Verificar si es una nueva quincena
    const isNewQuincena = currentQuincena !== state.currentQuincena || 
                         currentMonth !== state.currentMonth || 
                         currentYear !== state.currentYear
    
    // Verificar si se debe hacer reset (domingo de fin de quincena)
    const shouldReset = autoReset && isSundayEndOfQuincena() && isNewQuincena
    
    setState(prev => ({
      currentQuincena,
      currentMonth,
      currentYear,
      lastResetDate: shouldReset ? now : prev.lastResetDate,
      isNewQuincena,
      shouldReset
    }))
    
    return { isNewQuincena, shouldReset }
  }, [state.currentQuincena, state.currentMonth, state.currentYear, autoReset, isSundayEndOfQuincena])

  // Función para obtener la fecha del próximo reset
  const getNextResetDate = useCallback(() => {
    const now = new Date()
    const currentQuincena = getCurrentQuincena()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    if (currentQuincena === 1) {
      // Si estamos en la primera quincena, el próximo reset es el domingo de la segunda quincena
      return new Date(currentYear, currentMonth, 16)
    } else {
      // Si estamos en la segunda quincena, el próximo reset es el domingo del primer día del próximo mes
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
      return new Date(nextYear, nextMonth, 1)
    }
  }, [])

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
    
    // Mostrar banner si faltan 2 días o menos para el reset
    return daysUntilReset <= 2
  }, [getNextResetDate])

  // Función para ejecutar el reset manualmente
  const executeReset = useCallback(() => {
    const now = new Date()
    setState(prev => ({
      ...prev,
      lastResetDate: now,
      shouldReset: false,
      isNewQuincena: false
    }))
    
    // Disparar evento personalizado para que otros componentes sepan que se hizo reset
    window.dispatchEvent(new CustomEvent('biweeklyReset', {
      detail: {
        resetDate: now,
        quincena: getCurrentQuincena(),
        month: now.getMonth(),
        year: now.getFullYear()
      }
    }))
  }, [])

  // Verificar nueva quincena cada minuto
  useEffect(() => {
    if (!autoReset) return

    const interval = setInterval(() => {
      checkNewQuincena()
    }, 60000) // Cada minuto

    return () => clearInterval(interval)
  }, [autoReset, checkNewQuincena])

  // Verificar al montar el componente
  useEffect(() => {
    checkNewQuincena()
  }, [checkNewQuincena])

  // Verificar si es lunes de inicio de quincena cada hora
  useEffect(() => {
    if (!autoReset) return

    const interval = setInterval(() => {
      if (isMondayStartOfQuincena()) {
        console.log('🔄 Lunes de inicio de quincena detectado - Ejecutando reset automático')
        executeReset()
      }
    }, 3600000) // Cada hora

    return () => clearInterval(interval)
  }, [autoReset, isMondayStartOfQuincena, executeReset])

  return {
    ...state,
    isMondayStartOfQuincena: isMondayStartOfQuincena(),
    isSundayEndOfQuincena: isSundayEndOfQuincena(),
    getNextResetDate,
    getFormattedNextReset,
    shouldShowResetBanner: shouldShowResetBanner(),
    executeReset,
    checkNewQuincena
  }
}
