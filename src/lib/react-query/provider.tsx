'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { type ReactNode } from 'react'
import { getQueryClient } from './client'

/**
 * React Query Provider Component
 *
 * IMPORTANT: Uses singleton QueryClient to prevent cache loss on re-mounts.
 * Previous implementation used useState which recreated the client on re-renders,
 * causing intermittent data loading failures.
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Get singleton instance - this is CRITICAL for cache stability
  const queryClient = getQueryClient()

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
