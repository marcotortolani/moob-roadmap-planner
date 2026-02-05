'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

/**
 * React Query Provider Component
 *
 * Configures QueryClient with optimized defaults for Supabase
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: Data is considered fresh for 1 minute
            staleTime: 60 * 1000, // 1 minute

            // Cache time: Unused data is garbage collected after 5 minutes
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

            // Refetch on window focus disabled (can be enabled per-query)
            refetchOnWindowFocus: false,

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
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  )
}
