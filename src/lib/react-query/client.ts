import { QueryClient } from '@tanstack/react-query'

/**
 * Create a new QueryClient with optimized defaults (Sprint 6.2)
 *
 * Performance Optimizations:
 * - Increased staleTime to reduce unnecessary refetches
 * - Disabled refetchOnWindowFocus (optimistic updates handle staleness)
 * - Longer cache time for better perceived performance
 * - Reduced retry attempts (fail fast)
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // ✅ SPRINT 6.2: Stale time optimized per data type
        // Products are considered fresh for 5 minutes (optimistic updates handle mutations)
        staleTime: 5 * 60 * 1000, // 5 minutes (was 1 minute)

        // Cache time: Keep unused data for 10 minutes before garbage collection
        gcTime: 10 * 60 * 1000, // 10 minutes (was 5 minutes)

        // ✅ SPRINT 6.2: Disable refetch on window focus
        // Optimistic updates + manual invalidations are sufficient
        // This prevents annoying refetches when switching tabs
        refetchOnWindowFocus: false, // (was true)

        // Keep refetch on reconnect for data freshness after network loss
        refetchOnReconnect: true,

        // ✅ SPRINT 6.2: Reduce retries - fail fast
        // Single retry is enough, avoids long loading states
        retry: 1, // (was 1, keeping it)

        // Retry delay: exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

/**
 * Get QueryClient singleton
 *
 * IMPORTANT: This pattern ensures QueryClient is created only once in the browser,
 * preventing cache loss on component re-mounts (e.g., after error boundary, auth changes).
 *
 * Server-side: Always creates a new client (required for SSR)
 * Client-side: Returns singleton instance
 */
export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This singleton pattern is CRITICAL for preventing cache loss
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}
