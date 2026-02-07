'use client'

import { useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { Product } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'

interface VelocityChartProps {
  products: Product[]
  weeklyData: Array<{
    week: string
    completed: number
    started: number
  }>
}

const chartConfig = {
  started: {
    label: 'Iniciados',
    color: '#94a3b8',
  },
  completed: {
    label: 'Completados',
    color: '#22c55e',
  },
  completionRate: {
    label: 'Tasa de Completación (%)',
    color: '#0052CC',
  },
} satisfies ChartConfig

export function VelocityChart({ products, weeklyData }: VelocityChartProps) {
  const chartData = useMemo(() => {
    // Calculate milestone completion rate per week
    return weeklyData.map((week) => {
      // For simplicity, use product completion as proxy
      // In a real app, you'd track milestone completion per week
      const completionRate = week.started > 0
        ? (week.completed / week.started) * 100
        : 0

      return {
        ...week,
        completionRate: Math.min(100, completionRate), // Cap at 100%
      }
    })
  }, [weeklyData])

  const averageCompleted = useMemo(() => {
    const total = chartData.reduce((sum, w) => sum + w.completed, 0)
    return chartData.length > 0 ? (total / chartData.length).toFixed(1) : '0'
  }, [chartData])

  const averageStarted = useMemo(() => {
    const total = chartData.reduce((sum, w) => sum + w.started, 0)
    return chartData.length > 0 ? (total / chartData.length).toFixed(1) : '0'
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <Card className="">
        <CardHeader className="">
          <CardTitle className="font-bold uppercase">Velocity Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay datos de velocidad para mostrar
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="">
      <CardHeader className="">
        <CardTitle className="font-bold uppercase">Velocity Chart - Últimas 12 Semanas</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000" />
            <XAxis
              dataKey="week"
              stroke="#000"
              tick={{ fill: '#000', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              label={{ value: 'Productos', angle: -90, position: 'insideLeft', fill: '#000' }}
              stroke="#000"
              tick={{ fill: '#000' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Tasa (%)', angle: 90, position: 'insideRight', fill: '#000' }}
              stroke="#000"
              tick={{ fill: '#000' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              yAxisId="left"
              dataKey="started"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="completed"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="completionRate"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ChartContainer>

        {/* Summary statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/20 rounded-md text-center">
            <div className="text-2xl font-semibold">{averageStarted}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Promedio iniciados/semana
            </div>
          </div>
          <div className="p-4 bg-secondary/20 rounded-md text-center">
            <div className="text-2xl font-semibold text-green-600">
              {averageCompleted}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Promedio completados/semana
            </div>
          </div>
          <div className="p-4 bg-secondary/20 rounded-md text-center">
            <div className="text-2xl font-semibold">
              {chartData[chartData.length - 1].started}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Iniciados última semana
            </div>
          </div>
          <div className="p-4 bg-secondary/20 rounded-md text-center">
            <div className="text-2xl font-semibold text-green-600">
              {chartData[chartData.length - 1].completed}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Completados última semana
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-secondary/20 rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>Velocity Chart:</strong> Muestra el throughput semanal de productos
            iniciados vs completados, junto con la tasa de completación. Un patrón
            saludable muestra barras verdes (completados) creciendo consistentemente.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
