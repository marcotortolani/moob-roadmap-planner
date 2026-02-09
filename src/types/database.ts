/**
 * Centralized Database Type Definitions
 *
 * These interfaces represent the actual database schema from Supabase.
 * Use these instead of `any` when working with database records.
 *
 * Sprint 3: Type Safety
 */

/**
 * Database User Record
 * Corresponds to public.users table
 */
export interface DbUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'ADMIN' | 'USER' | 'GUEST' | 'BLOCKED'
  avatar_url: string | null
  auth_user_id: string
  created_at: string
  updated_at: string
}

/**
 * Database Product Record
 * Corresponds to public.products table
 */
export interface DbProduct {
  id: string
  name: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'DEMO_OK' | 'LIVE'
  operator: string
  country: string
  language: string
  start_date: string
  end_date: string
  productive_url: string | null
  vercel_demo_url: string | null
  wp_content_prod_url: string | null
  wp_content_test_url: string | null
  chatbot_url: string | null
  card_color: string
  comments: string | null
  created_by_id: string
  updated_by_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Database Milestone Record
 * Corresponds to public.milestones table
 */
export interface DbMilestone {
  id: string
  product_id: string
  name: string
  start_date: string
  end_date: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  created_at: string
}

/**
 * Database Invitation Record
 * Corresponds to public.invitations table
 */
export interface DbInvitation {
  id: string
  email: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  token: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
  expires_at: string
  sent_by_id: string
  accepted_at: string | null
  created_at: string
}

/**
 * Database Holiday Record
 * Corresponds to public.holidays table
 */
export interface DbHoliday {
  id: string
  name: string
  date: string
  country: string
  is_recurring: boolean
  created_at: string
}

/**
 * Database Product History Record
 * Corresponds to public.product_history table
 */
export interface DbProductHistory {
  id: string
  product_id: string
  changed_by_id: string
  change_type: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'DELETED'
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  changed_at: string
}

/**
 * Database Operator Record
 * Corresponds to public.operators table
 */
export interface DbOperator {
  id: string
  name: string
  normalized_name: string
  created_at: string
}

/**
 * Database Product Name Record
 * Corresponds to public.product_names table
 */
export interface DbProductName {
  id: string
  name: string
  normalized_name: string
  created_at: string
}

/**
 * Supabase Query Error
 * Standard error structure from Supabase queries
 */
export interface DbError {
  message: string
  code?: string
  details?: string
  hint?: string
}

/**
 * Generic API Error Response
 */
export interface ApiErrorResponse {
  error: string
  code?: string
  details?: unknown
  statusCode?: number
}

/**
 * Type guard to check if an error is a DbError
 */
export function isDbError(error: unknown): error is DbError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as DbError).message === 'string'
  )
}

/**
 * Type guard to check if a value is a valid user role
 */
export function isValidUserRole(role: unknown): role is DbUser['role'] {
  return (
    typeof role === 'string' &&
    ['ADMIN', 'USER', 'GUEST', 'BLOCKED'].includes(role)
  )
}

/**
 * Type guard to check if a value is a valid product status
 */
export function isValidProductStatus(status: unknown): status is DbProduct['status'] {
  return (
    typeof status === 'string' &&
    ['PLANNED', 'IN_PROGRESS', 'DEMO_OK', 'LIVE'].includes(status)
  )
}

/**
 * Type guard to check if a value is a valid invitation status
 */
export function isValidInvitationStatus(status: unknown): status is DbInvitation['status'] {
  return (
    typeof status === 'string' &&
    ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'].includes(status)
  )
}
