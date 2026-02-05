'use client'

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Singleton instance of Supabase client
 * IMPORTANT: Must be singleton to prevent:
 * - Auth token loss on HMR/re-imports
 * - Multiple connection pools
 * - State inconsistencies
 */
let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Get Supabase client for browser
 * Uses SSR-compatible client from @supabase/ssr
 *
 * Returns singleton instance to ensure auth state and connection pool stability
 */
export function getSupabaseClient() {
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

// Export singleton instance
export const supabase = getSupabaseClient()
