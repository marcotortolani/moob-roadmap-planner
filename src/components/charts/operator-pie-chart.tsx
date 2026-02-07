'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import type { Product } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'

const COLORS = [
  '#0052CC', // Primary blue
  '#FF2E63', // Red
  '#FFD700', // Yellow
  '#2EBD59', // Green
  '#9B72AA', // Purple
  '#FF8787', // Light coral
  '#4D96FF', // Light blue
  '#6BCB77', // Light green
  '#FF6B6B', // Coral
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
      .map(([name, value], index) => ({
        name,
        value,
        fill: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [products])

  const chartConfig = useMemo(
    () =>
      data.reduce(
        (acc, item, index) => {
          acc[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length],
          }
          return acc
        },
        {} as ChartConfig
      ),
    [data]
  )

  const totalProducts = products.length

  if (totalProducts === 0) {
    return (
      <Card className="">
        <CardHeader className="">
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
    <Card className="">
      <CardHeader className="">
        <CardTitle className="font-bold uppercase">Productos por Operador</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              strokeWidth={2}
              stroke="#000"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>

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
