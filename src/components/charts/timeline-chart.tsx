'use client'

import { useMemo } from 'react'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Product } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STATUS_COLORS = {
  PLANNED: '#94a3b8',
  IN_PROGRESS: '#ef4444',
  DEMO_OK: '#eab308',
  LIVE: '#22c55e',
}

interface TimelineChartProps {
  products: Product[]
  limit?: number
}

export function TimelineChart({ products, limit = 10 }: TimelineChartProps) {
  const timelineData = useMemo(() => {
    const now = new Date()

    // Get upcoming and in-progress products, sorted by end date
    const relevantProducts = products
      .filter((p) => p.endDate >= now || p.status === 'IN_PROGRESS')
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
      .slice(0, limit)

    if (relevantProducts.length === 0) return null

    // Calculate date range
    const earliestStart = relevantProducts.reduce(
      (min, p) => (p.startDate < min ? p.startDate : min),
      relevantProducts[0].startDate
    )
    const latestEnd = relevantProducts.reduce(
      (max, p) => (p.endDate > max ? p.endDate : max),
      relevantProducts[0].endDate
    )

    const totalDays = differenceInDays(latestEnd, earliestStart)

    return {
      products: relevantProducts,
      earliestStart,
      latestEnd,
      totalDays,
      now,
    }
  }, [products, limit])

  if (!timelineData || timelineData.products.length === 0) {
    return (
      <Card className="neo-card" style={{ borderRadius: 0 }}>
        <CardHeader className="border-b-2 border-black">
          <CardTitle className="font-bold uppercase">Timeline de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay productos próximos para mostrar
          </p>
        </CardContent>
      </Card>
    )
  }

  const { products: relevantProducts, earliestStart, totalDays, now } = timelineData

  const calculatePosition = (date: Date) => {
    const daysFromStart = differenceInDays(date, earliestStart)
    return (daysFromStart / totalDays) * 100
  }

  const todayPosition = calculatePosition(now)

  return (
    <Card className="neo-card" style={{ borderRadius: 0 }}>
      <CardHeader className="border-b-2 border-black">
        <CardTitle className="font-bold uppercase">Timeline de Productos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relevantProducts.map((product) => {
            const startPos = calculatePosition(product.startDate)
            const endPos = calculatePosition(product.endDate)
            const width = endPos - startPos

            return (
              <div key={product.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[60%]" title={product.name}>
                    {product.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(product.startDate, 'd MMM', { locale: es })} -{' '}
                    {format(product.endDate, 'd MMM, yyyy', { locale: es })}
                  </span>
                </div>
                <div className="relative h-8 bg-secondary/20 rounded-md overflow-hidden">
                  {/* Product bar */}
                  <div
                    className="absolute top-0 h-full rounded-sm flex items-center justify-center text-xs font-medium text-white transition-all"
                    style={{
                      left: `${startPos}%`,
                      width: `${width}%`,
                      backgroundColor: STATUS_COLORS[product.status],
                      minWidth: '40px',
                    }}
                  >
                    <span className="truncate px-2">{product.operator}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Today marker */}
          <div className="relative h-2 mt-4">
            <div
              className="absolute top-0 w-0.5 h-full bg-primary"
              style={{ left: `${todayPosition}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-medium text-primary whitespace-nowrap">
                Hoy
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">
                {status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
