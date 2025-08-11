"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorMessageProps {
  error: Error | null
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ error, onRetry, className }: ErrorMessageProps) {
  if (!error) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4 bg-transparent">
            Reintentar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
