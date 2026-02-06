'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { Product } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = [
  '#778899', // Slate blue (primary)
  '#90EE90', // Soft green (accent)
  '#4169E1', // Royal blue
  '#FF6B6B', // Coral
  '#FFD93D', // Yellow
  '#6BCB77', // Green
  '#4D96FF', // Light blue
  '#FF8787', // Light coral
  '#9B72AA', // Purple
  '#FFA07A', // Light salmon
]

interface OperatorPieChartProps {
  products: Product[]
}

export function OperatorPieChart({ products }: OperatorPieChartProps) {
  const data = useMemo(() => {
    const operatorCounts = products.reduce(
      (acc, product) => {
        acc[product.operator] = (acc[product.operator] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return Object.entries(operatorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [products])

  const totalProducts = products.length

  if (totalProducts === 0) {
    return (
      <Card className="neo-card" style={{ borderRadius: 0 }}>
        <CardHeader className="border-b-2 border-black">
          <CardTitle className="font-bold uppercase">Productos por Operador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay datos para mostrar
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="neo-card" style={{ borderRadius: 0 }}>
      <CardHeader className="border-b-2 border-black">
        <CardTitle className="font-bold uppercase">Productos por Operador</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} productos`, 'Total']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{item.name}</span>
              </div>
              <span className="font-medium">
                {item.value} ({((item.value / totalProducts) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
