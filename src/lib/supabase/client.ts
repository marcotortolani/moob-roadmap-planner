'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Get Supabase client for browser
 * Uses SSR-compatible client from @supabase/ssr
 */
export function getSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export instance (will be recreated on each import, which is fine for client-side)
export const supabase = getSupabaseClient()
