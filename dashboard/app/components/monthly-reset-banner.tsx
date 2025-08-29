"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Calendar, Info } from 'lucide-react'
import { useMonthlyReset } from '@/hooks/use-monthly-reset'

interface MonthlyResetBannerProps {
  showCountdown?: boolean
  showResetButton?: boolean
  className?: string
}

export function MonthlyResetBanner({
  showCountdown = true,
  showResetButton = true,
  className = ""
}: MonthlyResetBannerProps) {
  const {
    shouldShowResetBanner,
    getFormattedNextReset,
    getNextResetDate,
    executeReset,
    lastResetDate,
    isNewMonth
  } = useMonthlyReset()

  const [timeUntilReset, setTimeUntilReset] = useState<string>("")
  const [showBanner, setShowBanner] = useState(false)

  // Calcular tiempo restante hasta el reset
  useEffect(() => {
    if (!shouldShowResetBanner) return

    const updateCountdown = () => {
      const now = new Date()
      const nextReset = getNextResetDate()
      const timeDiff = nextReset.getTime() - now.getTime()

      if (timeDiff <= 0) {
        setTimeUntilReset("¡Reset ahora!")
        return
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeUntilReset(`${days} día${days > 1 ? 's' : ''}`)
      } else if (hours > 0) {
        setTimeUntilReset(`${hours} hora${hours > 1 ? 's' : ''}`)
      } else {
        setTimeUntilReset(`${minutes} minuto${minutes > 1 ? 's' : ''}`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Actualizar cada minuto

    return () => clearInterval(interval)
  }, [shouldShowResetBanner, getNextResetDate])

  // Mostrar banner si es necesario
  useEffect(() => {
    setShowBanner(shouldShowResetBanner || isNewMonth)
  }, [shouldShowResetBanner, isNewMonth])

  // Escuchar eventos de reset
  useEffect(() => {
    const handleMonthlyReset = () => {
      setShowBanner(false)
      // Recargar la página después de un breve delay para mostrar el reset
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }

    window.addEventListener('monthlyReset', handleMonthlyReset)
    return () => window.removeEventListener('monthlyReset', handleMonthlyReset)
  }, [])

  if (!showBanner) return null

  const handleManualReset = () => {
    if (confirm('¿Estás seguro de que quieres ejecutar el reset mensual ahora? Esto limpiará todos los datos del dashboard.')) {
      executeReset()
    }
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-800">
                Reset Mensual del Dashboard
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-orange-700">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Próximo reset: {getFormattedNextReset()}</span>
              </div>
              
              {showCountdown && timeUntilReset && (
                <div className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  <span>Faltan: {timeUntilReset}</span>
                </div>
              )}
            </div>
          </div>

          {showResetButton && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualReset}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Manual
              </Button>
            </div>
          )}
        </div>

        <div className="mt-3 text-sm text-orange-600">
          <p>
            <strong>Nota:</strong> El sistema realizará un reset automático cada lunes de inicio de mes. 
            Los datos se mantienen en la base de datos para el historial, pero el dashboard se mostrará desde cero.
          </p>
          {lastResetDate && (
            <p className="mt-1">
              Último reset: {lastResetDate.toLocaleDateString('es-CR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
