import { QueryClient } from '@tanstack/react-query'

/**
 * Create a new QueryClient with optimized defaults
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: Data is considered fresh for 1 minute
        staleTime: 60 * 1000,

        // Cache time: Unused data is garbage collected after 5 minutes
        gcTime: 5 * 60 * 1000,

        // Refetch on window focus to recover from stale states
        refetchOnWindowFocus: true,

        // Refetch on reconnect enabled
        refetchOnReconnect: true,

        // Retry failed requests once
        retry: 1,

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
