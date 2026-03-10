/**
 * Simple in-memory rate limiter for API routes.
 *
 * NOTE: In serverless environments (Vercel), this state is per-instance.
 * For production-grade cross-instance rate limiting, use Upstash Redis.
 * This implementation provides meaningful protection against basic brute-force
 * attacks while keeping the implementation dependency-free.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of store) {
        if (entry.resetAt < now) {
          store.delete(key)
        }
      }
    },
    5 * 60 * 1000
  )
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

/**
 * Check if a request is within the rate limit.
 *
 * @param key Unique key per subject (e.g., IP + endpoint)
 * @param config Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // Start a new window
    const resetAt = now + config.windowMs
    store.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
      retryAfterSeconds: 0,
    }
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    retryAfterSeconds: 0,
  }
}

/**
 * Pre-configured rate limit configs for common use cases
 */
export const RATE_LIMITS = {
  /** Login attempts: 10 per 15 minutes per IP */
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  /** Password reset: 3 per hour per IP */
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** Password change: 5 per 15 minutes per user */
  passwordChange: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Invitation send: 20 per hour per admin */
  invitationSend: { limit: 20, windowMs: 60 * 60 * 1000 },
  /** Invitation revoke: 30 per hour per admin */
  invitationRevoke: { limit: 30, windowMs: 60 * 60 * 1000 },
  /** Invitation delete: 30 per hour per admin */
  invitationDelete: { limit: 30, windowMs: 60 * 60 * 1000 },
  /** User delete: 10 per hour per admin */
  userDelete: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** Email send: 10 per hour per IP */
  emailSend: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const
