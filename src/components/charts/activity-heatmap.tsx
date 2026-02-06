'use client'

import { useMemo } from 'react'
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { Product } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityHeatmapProps {
  products: Product[]
  monthsToShow?: number
}

export function ActivityHeatmap({ products, monthsToShow = 3 }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const now = new Date()
    const startDate = startOfMonth(subMonths(now, monthsToShow - 1))
    const endDate = endOfMonth(now)

    // Get all days in the range
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

    // Count starts and ends per day
    const activityByDay = allDays.map((day) => {
      const starts = products.filter((p) => isSameDay(p.startDate, day)).length
      const ends = products.filter((p) => isSameDay(p.endDate, day)).length
      const total = starts + ends

      return {
        date: day,
        starts,
        ends,
        total,
      }
    })

    // Find max activity for color scaling
    const maxActivity = Math.max(...activityByDay.map((d) => d.total), 1)

    // Group by weeks
    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 }
    )

    return {
      activityByDay,
      maxActivity,
      weeks,
      startDate,
      endDate,
    }
  }, [products, monthsToShow])

  const { activityByDay, maxActivity, weeks, startDate, endDate } = heatmapData

  const getIntensityColor = (total: number) => {
    if (total === 0) return 'bg-secondary/10'

    const intensity = total / maxActivity

    if (intensity >= 0.75) return 'bg-green-500'
    if (intensity >= 0.5) return 'bg-green-400'
    if (intensity >= 0.25) return 'bg-green-300'
    return 'bg-green-200'
  }

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <Card className="neo-card" style={{ borderRadius: 0 }}>
      <CardHeader className="border-b-2 border-black">
        <CardTitle className="font-bold uppercase">Heatmap de Actividad</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(startDate, 'MMMM yyyy', { locale: es })} -{' '}
          {format(endDate, 'MMMM yyyy', { locale: es })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Week day labels */}
            <div className="flex gap-1 mb-2">
              <div className="w-8" /> {/* Spacer for week labels */}
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="w-3 h-3 text-[10px] text-muted-foreground text-center"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {weeks.map((weekStart) => {
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
                const daysInWeek = eachDayOfInterval({
                  start: weekStart,
                  end: weekEnd,
                })

                return (
                  <div key={weekStart.toISOString()} className="flex gap-1 items-center">
                    {/* Week label */}
                    <div className="w-8 text-[10px] text-muted-foreground text-right pr-1">
                      {format(weekStart, 'dd MMM', { locale: es })}
                    </div>

                    {/* Days */}
                    {daysInWeek.map((day) => {
                      const dayData = activityByDay.find((d) =>
                        isSameDay(d.date, day)
                      )

                      if (!dayData) {
                        return <div key={day.toISOString()} className="w-3 h-3" />
                      }

                      return (
                        <div
                          key={day.toISOString()}
                          className={`w-3 h-3 rounded-sm ${getIntensityColor(dayData.total)} transition-all hover:ring-2 hover:ring-primary cursor-pointer`}
                          title={`${format(day, 'd MMM yyyy', { locale: es })}\n${dayData.starts} inicio(s)\n${dayData.ends} fin(es)`}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-xs text-muted-foreground">Menos actividad</div>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-secondary/10" />
            <div className="w-3 h-3 rounded-sm bg-green-200" />
            <div className="w-3 h-3 rounded-sm bg-green-300" />
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
          </div>
          <div className="text-xs text-muted-foreground">Más actividad</div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-4 bg-secondary/20 rounded-md text-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">
                {activityByDay.reduce((sum, d) => sum + d.starts, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Inicios</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {activityByDay.reduce((sum, d) => sum + d.ends, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Finalizaciones</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{maxActivity}</div>
              <div className="text-xs text-muted-foreground">Pico de actividad</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
