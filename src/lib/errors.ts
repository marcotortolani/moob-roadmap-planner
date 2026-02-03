/**
 * Custom error types for type-safe error handling
 */

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(
    public entityType: string,
    public id: string,
  ) {
    super(`${entityType} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public operation: 'read' | 'write' | 'delete',
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Result type for operations that can fail
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false
      error: ValidationError | NotFoundError | StorageError | AuthorizationError
      message: string
    }

/**
 * Helper to create success result
 */
export function success<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

/**
 * Helper to create error result
 */
export function failure<T>(
  error: ValidationError | NotFoundError | StorageError | AuthorizationError,
  message?: string,
): ActionResult<T> {
  return {
    success: false,
    error,
    message: message || error.message,
  }
}

/**
 * Type guard to check if result is success
 */
export function isSuccess<T>(
  result: ActionResult<T>,
): result is { success: true; data: T } {
  return result.success
}

/**
 * Type guard to check if result is failure
 */
export function isFailure<T>(
  result: ActionResult<T>,
): result is {
  success: false
  error: ValidationError | NotFoundError | StorageError | AuthorizationError
  message: string
} {
  return !result.success
}
