'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useProducts } from '@/hooks/queries'

/**
 * Debug panel to diagnose blank page issues
 * Only renders in development mode
 */
export function DebugPanel() {
  const [mounted, setMounted] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts()

  useEffect(() => {
    setMounted(true)
    console.log('🔍 Debug Panel Mounted')
    console.log('Auth:', { user, authLoading })
    console.log('Products:', { products, productsLoading, productsError })
  }, [user, authLoading, products, productsLoading, productsError])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm">
      <div className="font-bold mb-2">🔍 Debug Panel</div>
      <div className="space-y-1">
        <div>Mounted: {mounted ? '✅' : '❌'}</div>
        <div>Auth Loading: {authLoading ? '⏳' : '✅'}</div>
        <div>User: {user ? `✅ ${user.email}` : '❌'}</div>
        <div>Products Loading: {productsLoading ? '⏳' : '✅'}</div>
        <div>Products Count: {products?.length ?? 0}</div>
        {productsError && (
          <div className="text-red-400">
            Error: {productsError.message}
          </div>
        )}
      </div>
    </div>
  )
}
