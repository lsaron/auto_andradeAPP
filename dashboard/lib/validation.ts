// Zod schemas for form validation (mirrors Pydantic models)
import { z } from "zod"

export const clientCreateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
  lastname: z.string().max(100, "El apellido es muy largo").optional(),
  email: z.string().email("Email inválido").max(100, "El email es muy largo"),
  phone: z.string().min(1, "El teléfono es requerido").max(20, "El teléfono es muy largo"),
  address: z.string().max(200, "La dirección es muy larga").optional(),
})

export const clientUpdateSchema = clientCreateSchema.partial()

export const carCreateSchema = z.object({
  license_plate: z.string().min(1, "La placa es requerida").max(20, "La placa es muy larga"),
  brand: z.string().min(1, "La marca es requerida").max(50, "La marca es muy larga"),
  model: z.string().min(1, "El modelo es requerido").max(50, "El modelo es muy largo"),
  year: z
    .number()
    .min(1900, "Año inválido")
    .max(new Date().getFullYear() + 1, "Año inválido"),
  color: z.string().max(30, "El color es muy largo").optional(),
  vin: z.string().max(17, "El VIN es muy largo").optional(),
  owner_id: z.string().min(1, "El propietario es requerido"),
  mileage: z.number().min(0, "El kilometraje no puede ser negativo").optional(),
})

export const carUpdateSchema = carCreateSchema.partial()

export const workOrderCreateSchema = z.object({
  car_id: z.string().min(1, "El vehículo es requerido"),
  client_id: z.string().min(1, "El cliente es requerido"),
  description: z.string().min(1, "La descripción es requerida").max(500, "La descripción es muy larga"),
  total_cost: z.number().min(0, "El costo total no puede ser negativo"),
  expenses: z.number().min(0, "Los gastos no pueden ser negativos"),
  mechanic_name: z.string().max(100, "El nombre del mecánico es muy largo").optional(),
  parts: z.array(z.string()).optional(),
  labor_hours: z.number().min(0, "Las horas de trabajo no pueden ser negativas").optional(),
})

export const workOrderUpdateSchema = workOrderCreateSchema.partial()

export type ClientCreateForm = z.infer<typeof clientCreateSchema>
export type ClientUpdateForm = z.infer<typeof clientUpdateSchema>
export type CarCreateForm = z.infer<typeof carCreateSchema>
export type CarUpdateForm = z.infer<typeof carUpdateSchema>
export type WorkOrderCreateForm = z.infer<typeof workOrderCreateSchema>
export type WorkOrderUpdateForm = z.infer<typeof workOrderUpdateSchema>
