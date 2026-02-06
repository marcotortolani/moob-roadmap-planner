'use client'

import { useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Product } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VelocityChartProps {
  products: Product[]
  weeklyData: Array<{
    week: string
    completed: number
    started: number
  }>
}

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
      <Card className="neo-card" style={{ borderRadius: 0 }}>
        <CardHeader className="border-b-2 border-black">
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
    <Card className="neo-card" style={{ borderRadius: 0 }}>
      <CardHeader className="border-b-2 border-black">
        <CardTitle className="font-bold uppercase">Velocity Chart - Últimas 12 Semanas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="left" label={{ value: 'Productos', angle: -90, position: 'insideLeft' }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Tasa (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="started"
              fill="#94a3b8"
              name="Iniciados"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="completed"
              fill="#22c55e"
              name="Completados"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="completionRate"
              stroke="#4169E1"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Tasa de Completación (%)"
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

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
