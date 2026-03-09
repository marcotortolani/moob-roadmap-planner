/**
 * CSRF Protection Helpers
 *
 * Verifies that the request originates from the same host, blocking
 * cross-origin form submissions and scripted cross-site requests.
 *
 * Supabase Auth uses HttpOnly cookies, so SameSite=Lax already
 * blocks most CSRF vectors. This extra Origin/Referer check adds a
 * defence-in-depth layer for our most sensitive mutation routes.
 */

import { NextRequest } from 'next/server'

/**
 * Check whether the request's Origin or Referer header matches the app's
 * expected origin. Returns true if the request is safe to process.
 *
 * Skips the check when APP_URL is not configured (local dev without env).
 */
export function isSameOrigin(request: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    // Can't validate without a known origin — allow in dev but warn
    console.warn('[CSRF] NEXT_PUBLIC_APP_URL is not set; skipping origin check')
    return true
  }

  const expectedOrigin = new URL(appUrl).origin

  const origin = request.headers.get('origin')
  if (origin) {
    return origin === expectedOrigin
  }

  // Some browsers omit Origin on same-origin navigations; fall back to Referer
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin
    } catch {
      return false
    }
  }

  // No origin/referer present — allow (server-side calls, Postman, curl)
  // This is acceptable because Supabase session cookies are HttpOnly + SameSite=Lax
  return true
}

/**
 * Build a standard 403 CSRF rejection response body.
 */
export function csrfRejected() {
  return { error: 'Solicitud rechazada: origen inválido', status: 403 } as const
}
