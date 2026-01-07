// src/components/charts/products-by-status-chart.tsx
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Product, Status } from '@/lib/types';
import { STATUS_OPTIONS } from '@/lib/constants';

interface ProductsByStatusChartProps {
  products: Product[];
}

const STATUS_COLORS: Record<Status, { fill: string, stroke: string }> = {
    PLANNED: { fill: '#FFFFFF', stroke: '#4B5563' },      // white, neutral-600
    IN_PROGRESS: { fill: '#FEE2E2', stroke: '#EF4444' }, // red-100, red-500
    DEMO_OK: { fill: '#FEF9C3', stroke: '#FBBF24' },     // yellow-100, amber-400
    LIVE: { fill: '#D1FAE5', stroke: '#10B981' },        // green-100, green-500
};

export function ProductsByStatusChart({ products }: ProductsByStatusChartProps) {
  const data = useMemo(() => {
    const statusCounts = products.reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return STATUS_OPTIONS.map((status) => ({
      name: status.label,
      value: status.value,
      count: statusCounts[status.value] || 0,
    }));
  }, [products]);

  return (
    <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                }}
            />
            <Legend />
            <Bar dataKey="count" name="Cantidad">
                {data.map((entry, index) => {
                    const colors = STATUS_COLORS[entry.value as Status];
                    return (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={colors.fill}
                            stroke={colors.stroke}
                            strokeWidth={2}
                        />
                    );
                })}
            </Bar>
        </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
