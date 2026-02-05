/**
 * Type-safe Supabase types
 * This file will be updated after running: npx supabase gen types typescript
 */

import type { Database as GeneratedDatabase } from './database.types'

export type Database = GeneratedDatabase

// Extract table types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// Type-safe table names
export type TableName = keyof Database['public']['Tables']

// Discriminated union for API responses
export type ApiResponse<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiError }

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

// Auth types
export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at?: number
}

export interface AuthUser {
  id: string
  email: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  user_metadata: {
    first_name?: string
    last_name?: string
    avatar_url?: string
  }
}
