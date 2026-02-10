// src/components/skeletons/product-list-skeleton.tsx

'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton for Product List View (Sprint 5.2)
 * Reflects the actual structure of year → quarter → products
 */
export function ProductListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Year 2026 */}
      <div className="space-y-4">
        {/* Year header */}
        <Skeleton className="h-8 w-24 bg-slate-200" />

        {/* Quarters */}
        {['Q1', 'Q2'].map((quarter, qIndex) => (
          <div key={quarter} className="space-y-3">
            {/* Quarter label */}
            <Skeleton className="h-6 w-16 bg-slate-200" />

            {/* Product cards grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(qIndex === 0 ? 4 : 2)].map((_, i) => (
                <ProductCardSkeleton key={i} delay={i * 0.1} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Year 2025 */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-24 bg-slate-200" />

        {/* Q4 only */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-16 bg-slate-200" />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(3)].map((_, i) => (
              <ProductCardSkeleton key={i} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Individual Product Card Skeleton
 * Matches the structure of ProductCard component
 */
function ProductCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="space-y-4 rounded-lg border-3 border-black shadow-neo-sm p-4 bg-white animate-pulse"
      style={{
        animationDelay: `${delay}s`,
      }}
    >
      {/* Header: Title + Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-6 w-32 bg-slate-200" />
        <Skeleton className="h-7 w-24 rounded-full bg-slate-200" />
      </div>

      {/* Operator */}
      <Skeleton className="h-4 w-28 bg-slate-200" />

      {/* Country + Language */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20 bg-slate-200" />
        <Skeleton className="h-4 w-16 bg-slate-200" />
      </div>

      {/* Dates */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full bg-slate-200" />
        <Skeleton className="h-4 w-3/4 bg-slate-200" />
      </div>

      {/* Bottom buttons */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Skeleton className="h-4 w-20 bg-slate-200" />
        <Skeleton className="h-8 w-8 rounded-md bg-slate-200" />
      </div>
    </div>
  )
}
