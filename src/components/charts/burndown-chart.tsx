'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  getQuarter,
  getYear,
  startOfQuarter,
  endOfQuarter,
  eachWeekOfInterval,
  isWithinInterval,
  isBefore,
  format,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { Product, Milestone } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BurndownChartProps {
  products: Product[]
}

export function BurndownChart({ products }: BurndownChartProps) {
  const data = useMemo(() => {
    const now = new Date()
    const currentQuarter = getQuarter(now)
    const currentYear = getYear(now)

    const quarterStart = startOfQuarter(now)
    const quarterEnd = endOfQuarter(now)

    // Get all milestones for products in current quarter
    const quarterMilestones: Milestone[] = []

    products.forEach((product) => {
      const productOverlapsQuarter =
        product.startDate <= quarterEnd && product.endDate >= quarterStart

      if (productOverlapsQuarter && product.milestones) {
        product.milestones.forEach((milestone) => {
          const milestoneInQuarter =
            isWithinInterval(milestone.startDate, {
              start: quarterStart,
              end: quarterEnd,
            }) ||
            isWithinInterval(milestone.endDate, {
              start: quarterStart,
              end: quarterEnd,
            })

          if (milestoneInQuarter) {
            quarterMilestones.push(milestone)
          }
        })
      }
    })

    if (quarterMilestones.length === 0) {
      return []
    }

    const totalMilestones = quarterMilestones.length

    // Get weeks in current quarter
    const weeks = eachWeekOfInterval(
      { start: quarterStart, end: quarterEnd },
      { weekStartsOn: 1 }
    )

    // Calculate ideal burndown (linear decrease)
    const idealBurnRate = totalMilestones / weeks.length

    return weeks.map((weekStart, index) => {
      // Ideal: linear decrease
      const ideal = Math.max(0, totalMilestones - idealBurnRate * (index + 1))

      // Actual: count remaining milestones at this week
      const remaining = quarterMilestones.filter((m) => {
        // If week is in the future, we can't know actual completion
        if (weekStart > now) return true

        // Count as remaining if not completed by this week
        return m.status !== 'COMPLETED' || m.endDate > weekStart
      }).length

      return {
        week: format(weekStart, 'dd MMM', { locale: es }),
        weekDate: weekStart,
        ideal: Math.round(ideal),
        actual: isBefore(weekStart, now) ? remaining : null, // Only show actual for past weeks
      }
    })
  }, [products])

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Burndown Chart - Trimestre Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay hitos en el trimestre actual
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Burndown Chart - Trimestre Actual</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis label={{ value: 'Hitos Restantes', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return format(payload[0].payload.weekDate, 'dd MMMM yyyy', { locale: es })
                }
                return label
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#94a3b8"
              strokeDasharray="5 5"
              name="Ideal"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#4169E1"
              name="Real"
              strokeWidth={2}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 p-4 bg-secondary/20 rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>Burndown Chart:</strong> Muestra el progreso de completación de hitos
            comparado con un ritmo ideal lineal. Si la línea real está por encima de la
            ideal, el equipo va retrasado.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
