/**
 * Type-safe error handling for the application
 */

// ============ Base Error Classes ============

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(
    public field: string,
    message: string,
    public details?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class NotFoundError extends AppError {
  constructor(
    public entityType: string,
    public id: string
  ) {
    super(
      `${entityType} con id ${id} no encontrado`,
      'NOT_FOUND',
      404
    )
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}

export class StorageError extends AppError {
  constructor(
    message: string,
    public operation: 'read' | 'write' | 'delete'
  ) {
    super(message, 'STORAGE_ERROR', 500)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: unknown) {
    super(message, 'DATABASE_ERROR', 500)
  }
}

// ============ Action Result Type ============

export type ActionResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: AppError; message?: string }

// ============ Helper Functions ============

export function success<T>(data: T): ActionResult<T> {
  return { success: true, data, error: null }
}

export function failure<T>(
  error: AppError,
  message?: string
): ActionResult<T> {
  return { success: false, data: null, error, message }
}

/**
 * Type guard to check if result is success
 */
export function isSuccess<T>(
  result: ActionResult<T>
): result is { success: true; data: T; error: null } {
  return result.success
}

/**
 * Type guard to check if result is failure
 */
export function isFailure<T>(
  result: ActionResult<T>
): result is { success: false; data: null; error: AppError } {
  return !result.success
}

/**
 * Unwrap result or throw error
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (isSuccess(result)) {
    return result.data
  }
  throw result.error
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR')
  }

  return new AppError(
    'Ha ocurrido un error desconocido',
    'UNKNOWN_ERROR'
  )
}
