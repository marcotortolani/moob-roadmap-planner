/**
 * Async utilities with timeout support
 *
 * Prevents infinite hangs on slow network operations
 */

/**
 * Custom error for timeout operations
 */
export class TimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`Timeout: ${operation} no respondió en ${timeoutMs / 1000}s`)
    this.name = 'TimeoutError'
  }
}

/**
 * Wraps a promise with a timeout
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param operation - Human-readable operation name (Spanish)
 * @returns The promise result or throws TimeoutError
 *
 * @example
 * ```ts
 * const data = await withTimeout(
 *   fetch('/api/users'),
 *   5000,
 *   'cargar usuarios'
 * )
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError(operation, timeoutMs)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

/**
 * Creates an AbortController with automatic timeout
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns Controller and cleanup function
 *
 * @example
 * ```ts
 * const { controller, cleanup } = createTimeoutController(5000)
 * try {
 *   await fetch('/api/data', { signal: controller.signal })
 * } finally {
 *   cleanup()
 * }
 * ```
 */
export function createTimeoutController(
  timeoutMs: number
): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  }
}

/**
 * Retries a promise with exponential backoff
 *
 * @param fn - Function that returns a promise
 * @param options - Retry configuration
 * @returns The promise result or throws last error
 *
 * @example
 * ```ts
 * const data = await withRetry(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3, baseDelay: 500 }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    onRetry?: (attempt: number, error: Error) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 500,
    maxDelay = 5000,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1s, 2s, 4s (capped at maxDelay)
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)

        onRetry?.(attempt + 1, lastError)

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}
