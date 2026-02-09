'use client'

import { z } from 'zod'
import { COUNTRIES } from './countries'
import { ENABLED_LANGUAGES } from './languages'

export type User = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER' | 'GUEST' | 'BLOCKED'
  avatarUrl?: string
  authUserId?: string // Supabase auth user ID
}

export enum Status {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  DEMO = 'DEMO',
  LIVE = 'LIVE',
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export const MilestoneSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, 'El nombre del hito es requerido.'),
    startDate: z.date({ required_error: 'La fecha de inicio es requerida.' }),
    endDate: z.date({
      required_error: 'La fecha de finalización es requerida.',
    }),
    status: z.nativeEnum(MilestoneStatus),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'La fecha de finalización no puede ser anterior a la de inicio.',
    path: ['endDate'],
  })

export const CustomUrlSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'La etiqueta es requerida.'),
  url: z.string().url('URL inválida.'),
})

const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]]
const languageCodes = ENABLED_LANGUAGES.map((l) => l.code) as [
  string,
  ...string[],
]

export const ProductSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre del producto es requerido.')
      .transform((val) => val.trim()),
    operator: z
      .string()
      .min(1, 'El operador es requerido.')
      .transform((val) => val.trim()),
    country: z.enum(countryCodes, {
      errorMap: () => ({ message: 'País inválido.' }),
    }),
    language: z.enum(languageCodes, {
      errorMap: () => ({ message: 'Idioma inválido.' }),
    }),
    startDate: z.date({ required_error: 'La fecha de inicio es requerida.' }),
    endDate: z.date({
      required_error: 'La fecha de finalización es requerida.',
    }),
    productiveUrl: z.string().url('URL inválida.').or(z.literal('')),
    vercelDemoUrl: z.string().url('URL inválida.').or(z.literal('')),
    wpContentProdUrl: z.string().url('URL inválida.').or(z.literal('')),
    wpContentTestUrl: z.string().url('URL inválida.').or(z.literal('')),
    chatbotUrl: z.string().url('URL inválida.').or(z.literal('')),
    comments: z.string().optional(),
    cardColor: z.string().regex(/^#[0-9a-fA-F]{6,9}$/, 'Color inválido.'),
    status: z.nativeEnum(Status),
    milestones: z.array(MilestoneSchema).optional(),
    customUrls: z.array(CustomUrlSchema).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'La fecha de finalización no puede ser anterior a la de inicio.',
    path: ['endDate'],
  })

export type ProductFormData = z.infer<typeof ProductSchema>

export type Milestone = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: MilestoneStatus
  productId: string
}

export type CustomUrl = {
  id: string
  label: string
  url: string
}

export type Product = {
  id: string
  name: string
  operator: string
  country: string
  language: string
  startDate: Date
  endDate: Date
  productiveUrl: string | null
  vercelDemoUrl: string | null
  wpContentProdUrl: string | null
  wpContentTestUrl: string | null
  chatbotUrl: string | null
  comments: string | null
  cardColor: string
  status: Status
  milestones: Milestone[]
  customUrls: CustomUrl[]
  createdAt: Date
  createdBy: User
  updatedAt: Date | null
  updatedBy: User | null
}

export type Holiday = {
  id: string
  date: Date
  name: string
}

export const HolidaySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  date: z.date({ required_error: 'La fecha es requerida.' }),
})

export type HolidayFormData = z.infer<typeof HolidaySchema>

export const UserProfileSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  avatarUrl: z.string().optional(),
})

export type UserProfileFormData = z.infer<typeof UserProfileSchema>

// Drag and Drop Types
export type DragCardType = 'first' | 'last' | 'middle' | 'single'

export interface ProductDragData {
  productId: string
  type: DragCardType
  date: Date
  product: Product
}

export interface DayCellDropData {
  date: Date
  isHoliday: boolean
  isBusinessDay: boolean
}

// New types for Operator and ProductName
export type Operator = {
  id: string
  name: string
  normalizedName: string
  createdById: string | null
  createdAt: Date
  updatedAt: Date
}

export type ProductName = {
  id: string
  name: string
  normalizedName: string
  description: string | null
  createdById: string | null
  createdAt: Date
  updatedAt: Date
}

// Zod schemas for CRUD operations
export const OperatorSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'El nombre del operador es requerido.')
    .transform((val) => val.trim()),
})

export const ProductNameSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'El nombre es requerido.')
    .transform((val) => val.trim()),
  description: z.string().optional(),
})

export type OperatorFormData = z.infer<typeof OperatorSchema>
export type ProductNameFormData = z.infer<typeof ProductNameSchema>
