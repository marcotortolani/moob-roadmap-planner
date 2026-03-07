'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>

/**
 * Singleton instance of Supabase client
 * IMPORTANT: Must be singleton to prevent:
 * - Auth token loss on HMR/re-imports
 * - Multiple connection pools
 * - State inconsistencies
 */
let supabaseInstance: BrowserSupabaseClient | null = null

/**
 * Get Supabase client for browser.
 * Uses createBrowserClient from @supabase/ssr (cookie-based session storage).
 * Cookies are required so the middleware can read the session server-side.
 *
 * Returns null during SSR — all callers are inside useEffect/event handlers.
 */
export function getSupabaseClient(): BrowserSupabaseClient {
  // Guard: createBrowserClient requires browser context.
  // During SSR, 'use client' components still render on the server but never
  // access supabase (all usage is inside useEffect / event handlers).
  if (typeof window === 'undefined') {
    return null as unknown as BrowserSupabaseClient
  }

  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance only if none exists
  supabaseInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseInstance
}
