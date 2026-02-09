// src/components/charts/products-by-status-chart.tsx
'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Product, Status } from '@/lib/types'
import { STATUS_OPTIONS } from '@/lib/constants'
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface ProductsByStatusChartProps {
  products: Product[]
}

const chartConfig = {
  count: {
    label: 'Cantidad',
  },
  PLANNED: {
    label: 'Programado',
    color: '#6B7280',
  },
  IN_PROGRESS: {
    label: 'En Proceso',
    color: '#FF2E63',
  },
  DEMO: {
    label: 'Demo OK',
    color: '#FFD700',
  },
  LIVE: {
    label: 'Productivo',
    color: '#2EBD59',
  },
} satisfies ChartConfig

export function ProductsByStatusChart({
  products,
}: ProductsByStatusChartProps) {
  const data = useMemo(() => {
    const statusCounts = products.reduce(
      (acc, product) => {
        acc[product.status] = (acc[product.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return STATUS_OPTIONS.map((status) => ({
      name: status.label,
      status: status.value,
      count: statusCounts[status.value] || 0,
      fill: `var(--color-${status.value})`,
    }))
  }, [products])

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#000" />
        <XAxis dataKey="name" stroke="#000" tick={{ fill: '#000' }} />
        <YAxis allowDecimals={false} stroke="#000" tick={{ fill: '#000' }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[0, 0, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
