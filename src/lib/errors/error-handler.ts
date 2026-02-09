/**
 * Centralized Error Handling Utilities
 *
 * Provides type-safe error handling, logging, and API error responses.
 * Use these utilities instead of `catch (error: any)` patterns.
 *
 * Sprint 3: Type Safety
 */

import type { DbError } from '@/types/database'

/**
 * Application Error Class
 * Extends Error with additional context for debugging
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

/**
 * Database Error Class
 * Specific to Supabase/PostgreSQL errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, public dbError?: DbError) {
    super(message, dbError?.code, 500, dbError?.details)
    this.name = 'DatabaseError'
  }
}

/**
 * Authentication Error Class
 * For auth-related failures
 */
export class AuthError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code, 401)
    this.name = 'AuthError'
  }
}

/**
 * Validation Error Class
 * For input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400, { field })
    this.name = 'ValidationError'
  }
}

/**
 * Extract error message from unknown error type
 * Handles Error objects, strings, objects with message, etc.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error
    }
  }

  return 'Unknown error occurred'
}

/**
 * Extract error code from unknown error type
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AppError) {
    return error.code
  }

  if (error && typeof error === 'object') {
    if ('code' in error && typeof error.code === 'string') {
      return error.code
    }
  }

  return undefined
}

/**
 * Check if error is a database error
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

/**
 * Structured logging for errors
 * Logs with timestamp, context, and metadata
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  const message = getErrorMessage(error)
  const code = getErrorCode(error)

  const logData = {
    timestamp,
    context,
    message,
    code,
    ...metadata,
  }

  // Log full error object in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${timestamp}] [ERROR] ${context}:`, {
      ...logData,
      error, // Include full error object
      stack: error instanceof Error ? error.stack : undefined,
    })
  } else {
    // Production: log only sanitized data (no stack traces)
    console.error(`[${timestamp}] [ERROR] ${context}:`, logData)
  }
}

/**
 * Log warning (non-error issues)
 */
export function logWarning(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  console.warn(`[${timestamp}] [WARNING] ${context}:`, {
    message,
    ...metadata,
  })
}

/**
 * Convert error to API response
 * Returns properly formatted Response object for Next.js API routes
 */
export function handleApiError(error: unknown): Response {
  const message = getErrorMessage(error)
  const code = getErrorCode(error)

  // Determine status code
  let statusCode = 500
  if (error instanceof AppError) {
    statusCode = error.statusCode || 500
  }

  // Don't leak internal errors in production
  const shouldHideDetails = process.env.NODE_ENV === 'production' && statusCode === 500
  const publicMessage = shouldHideDetails ? 'Internal server error' : message

  return Response.json(
    {
      error: publicMessage,
      code,
    },
    { status: statusCode }
  )
}

/**
 * Safe async operation wrapper
 * Catches errors and returns typed result
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    logError(context, error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(getErrorMessage(error)),
    }
  }
}

/**
 * Assert that value is not null/undefined
 * Throws error if value is nullish
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AppError(message, 'ASSERTION_ERROR', 500)
  }
}

/**
 * Type guard for non-null values
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Format error for user display
 * Strips technical details and returns user-friendly message
 */
export function formatUserError(error: unknown): string {
  const message = getErrorMessage(error)

  // Map common error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    PGRST116: 'No se encontraron registros',
    '23505': 'Este registro ya existe',
    '23503': 'No se puede eliminar: existen referencias a este registro',
    '23502': 'Faltan campos requeridos',
    '42501': 'No tienes permisos para realizar esta acción',
    VALIDATION_ERROR: 'Error de validación',
    AUTH_ERROR: 'Error de autenticación',
  }

  const code = getErrorCode(error)
  if (code && errorMap[code]) {
    return errorMap[code]
  }

  // Return message if it looks user-friendly (no stack traces, no technical jargon)
  if (
    !message.includes('Error:') &&
    !message.includes('at ') &&
    !message.includes('stack')
  ) {
    return message
  }

  // Default user-friendly message
  return 'Ocurrió un error. Por favor intenta nuevamente.'
}
