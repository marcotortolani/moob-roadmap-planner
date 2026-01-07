// src/components/charts/products-by-country-chart.tsx
'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Product } from '@/lib/types';
import { COUNTRIES } from '@/lib/countries';

interface ProductsByCountryChartProps {
  products: Product[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ProductsByCountryChart({ products }: ProductsByCountryChartProps) {
  const data = useMemo(() => {
    const countryCounts = products.reduce((acc, product) => {
      acc[product.country] = (acc[product.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countryCounts)
      .map(([countryCode, count]) => {
        const country = COUNTRIES.find((c) => c.code === countryCode);
        return {
          name: country?.name || countryCode,
          value: count,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [products]);

  if (data.length === 0) {
    return <div className="h-[350px] flex items-center justify-center text-muted-foreground">No hay datos para mostrar</div>
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
            }}
          />
          <Legend formatter={(value, entry) => {
            const { payload } = entry;
            return `${value} (${payload?.value})`
          }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
