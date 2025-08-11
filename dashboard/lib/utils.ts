import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for data transformation
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Convert snake_case to camelCase for API responses
export function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }

  const camelCaseObj: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    camelCaseObj[camelKey] = toCamelCase(value)
  }
  return camelCaseObj
}

// Convert camelCase to snake_case for API requests
export function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }

  const snakeCaseObj: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    snakeCaseObj[snakeKey] = toSnakeCase(value)
  }
  return snakeCaseObj
}

// Debounce function for search
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
}

export function isValidLicensePlate(plate: string): boolean {
  // Mexican license plate format: ABC-123 or ABC-1234
  const plateRegex = /^[A-Z]{3}-\d{3,4}$/
  return plateRegex.test(plate.toUpperCase())
}
