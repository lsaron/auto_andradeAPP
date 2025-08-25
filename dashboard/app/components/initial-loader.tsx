"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export function InitialLoader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time and hide loader after 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-50">
      <div className="flex flex-col items-center space-y-8">
        {/* Logo with pulse animation */}
        <div className="animate-pulse">
          <Image
            src="/auto-andrade.png"
            alt="Auto Andrade Logo"
            width={300}
            height={150}
            priority
            className="object-contain"
          />
        </div>

        {/* Loading spinner */}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>

        {/* Loading text */}
        <p className="text-gray-600 text-lg font-medium">Cargando sistema...</p>
      </div>
    </div>
  )
}
