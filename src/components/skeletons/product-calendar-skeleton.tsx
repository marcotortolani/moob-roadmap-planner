// src/components/skeletons/product-calendar-skeleton.tsx

'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton for Product Calendar View (Sprint 5.2)
 * Reflects the actual calendar grid structure
 */
export function ProductCalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-9 rounded-md bg-slate-200" />
        <Skeleton className="h-8 w-40 bg-slate-200" />
        <Skeleton className="h-9 w-9 rounded-md bg-slate-200" />
      </div>

      {/* Calendar Grid */}
      <div className="border-3 border-black shadow-neo-md overflow-hidden rounded-lg">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-slate-100">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium border-r border-b border-black last:border-r-0"
            >
              <Skeleton className="h-4 w-8 mx-auto bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Week rows */}
        {[...Array(5)].map((_, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {[...Array(7)].map((_, dayIndex) => (
              <CalendarDayCellSkeleton
                key={dayIndex}
                hasProducts={Math.random() > 0.6}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <Skeleton className="h-4 w-24 bg-slate-200" />
        <Skeleton className="h-4 w-28 bg-slate-200" />
        <Skeleton className="h-4 w-32 bg-slate-200" />
      </div>
    </div>
  )
}

/**
 * Individual Calendar Day Cell Skeleton
 */
function CalendarDayCellSkeleton({ hasProducts }: { hasProducts: boolean }) {
  return (
    <div className="min-h-[120px] p-2 border-r border-b border-black last:border-r-0 bg-white">
      {/* Day number */}
      <div className="mb-2">
        <Skeleton className="h-5 w-6 bg-slate-200" />
      </div>

      {/* Product indicators */}
      {hasProducts && (
        <div className="space-y-1">
          <Skeleton className="h-2 w-full rounded-full bg-blue-200" />
          {Math.random() > 0.5 && (
            <Skeleton className="h-2 w-3/4 rounded-full bg-green-200" />
          )}
          {Math.random() > 0.7 && (
            <Skeleton className="h-2 w-1/2 rounded-full bg-purple-200" />
          )}
        </div>
      )}
    </div>
  )
}
