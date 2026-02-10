// src/components/skeletons/chart-skeleton.tsx

'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Generic Chart Skeleton (Sprint 6.1)
 * Used while lazy-loading Recharts components
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="space-y-4 p-4">
        {/* Chart title area */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 bg-slate-200" />
          <Skeleton className="h-5 w-20 bg-slate-200" />
        </div>

        {/* Chart area */}
        <div className="relative" style={{ height: `${height - 80}px` }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-8 bg-slate-200" />
            ))}
          </div>

          {/* Chart bars/lines placeholder */}
          <div className="ml-14 h-full flex items-end justify-around gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 bg-slate-200 animate-pulse"
                style={{
                  height: `${Math.random() * 60 + 40}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-14 flex justify-around">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-12 bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Pie Chart Skeleton
 */
export function PieChartSkeleton({ size = 250 }: { size?: number }) {
  return (
    <div className="w-full flex items-center justify-center" style={{ height: `${size + 100}px` }}>
      <div className="space-y-4">
        {/* Pie chart circle */}
        <div className="flex items-center justify-center">
          <Skeleton
            className="rounded-full bg-slate-200 animate-pulse"
            style={{ width: `${size}px`, height: `${size}px` }}
          />
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-sm bg-slate-200" />
              <Skeleton className="h-3 w-24 bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Line Chart Skeleton
 */
export function LineChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="space-y-4 p-4">
        {/* Chart area with line pattern */}
        <div className="relative" style={{ height: `${height - 80}px` }}>
          {/* Y-axis */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-8 bg-slate-200" />
            ))}
          </div>

          {/* Line chart placeholder - wavy pattern */}
          <div className="ml-14 h-full relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <path
                d="M 0 150 Q 100 50 200 100 T 400 50"
                stroke="#e2e8f0"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M 0 180 Q 100 100 200 150 T 400 100"
                stroke="#e2e8f0"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
            </svg>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-14 flex justify-around">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-16 bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  )
}
