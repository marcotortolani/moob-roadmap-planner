'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { getQuarter, getYear, startOfQuarter, endOfQuarter, isWithinInterval } from 'date-fns'
import type { Product, Milestone } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'

interface MilestoneProgressChartProps {
  products: Product[]
}

const chartConfig = {
  PENDING: {
    label: 'Pendientes',
    color: '#94a3b8',
  },
  IN_PROGRESS: {
    label: 'En Progreso',
    color: '#eab308',
  },
  COMPLETED: {
    label: 'Completados',
    color: '#22c55e',
  },
} satisfies ChartConfig

export function MilestoneProgressChart({ products }: MilestoneProgressChartProps) {
  const data = useMemo(() => {
    const now = new Date()
    const currentYear = getYear(now)
    const currentQuarter = getQuarter(now)

    // Get last 4 quarters including current
    const quarters: Array<{
      name: string
      year: number
      quarter: number
      PENDING: number
      IN_PROGRESS: number
      COMPLETED: number
    }> = []

    for (let i = 3; i >= 0; i--) {
      let q = currentQuarter - i
      let y = currentYear

      // Handle year rollover
      while (q <= 0) {
        q += 4
        y -= 1
      }

      const quarterStart = startOfQuarter(new Date(y, (q - 1) * 3, 1))
      const quarterEnd = endOfQuarter(quarterStart)

      // Get all milestones for products in this quarter
      const quarterMilestones: Milestone[] = []

      products.forEach((product) => {
        // Check if product overlaps with this quarter
        const productOverlapsQuarter =
          product.startDate <= quarterEnd && product.endDate >= quarterStart

        if (productOverlapsQuarter && product.milestones) {
          // Include milestones that fall within this quarter
          product.milestones.forEach((milestone) => {
            const milestoneInQuarter = isWithinInterval(milestone.startDate, {
              start: quarterStart,
              end: quarterEnd,
            }) || isWithinInterval(milestone.endDate, {
              start: quarterStart,
              end: quarterEnd,
            })

            if (milestoneInQuarter) {
              quarterMilestones.push(milestone)
            }
          })
        }
      })

      const pending = quarterMilestones.filter((m) => m.status === 'PENDING').length
      const inProgress = quarterMilestones.filter((m) => m.status === 'IN_PROGRESS').length
      const completed = quarterMilestones.filter((m) => m.status === 'COMPLETED').length

      quarters.push({
        name: `Q${q} ${y}`,
        year: y,
        quarter: q,
        PENDING: pending,
        IN_PROGRESS: inProgress,
        COMPLETED: completed,
      })
    }

    return quarters
  }, [products])

  const hasData = data.some((q) => q.PENDING + q.IN_PROGRESS + q.COMPLETED > 0)

  if (!hasData) {
    return (
      <Card className="">
        <CardHeader className="">
          <CardTitle className="font-bold uppercase">Progreso de Hitos por Trimestre</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay hitos para mostrar
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="">
      <CardHeader className="">
        <CardTitle className="font-bold uppercase">Progreso de Hitos por Trimestre</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000" />
            <XAxis
              dataKey="name"
              stroke="#000"
              tick={{ fill: '#000' }}
            />
            <YAxis
              allowDecimals={false}
              stroke="#000"
              tick={{ fill: '#000' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="PENDING" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="IN_PROGRESS" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="COMPLETED" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>

        {/* Summary statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          {data.map((quarter) => {
            const total = quarter.PENDING + quarter.IN_PROGRESS + quarter.COMPLETED
            const completionRate = total > 0 ? (quarter.COMPLETED / total) * 100 : 0

            return (
              <div key={quarter.name} className="space-y-1">
                <div className="text-xs text-muted-foreground">{quarter.name}</div>
                <div className="text-lg font-semibold">{completionRate.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">
                  {quarter.COMPLETED}/{total} completados
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
