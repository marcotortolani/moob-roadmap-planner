// src/components/charts/products-by-country-chart.tsx
'use client';

import { useMemo } from 'react';
import { PieChart, Pie } from 'recharts';
import { Product } from '@/lib/types';
import { COUNTRIES } from '@/lib/countries';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

interface ProductsByCountryChartProps {
  products: Product[];
}

const COLORS = ['#0052CC', '#FF2E63', '#FFD700', '#2EBD59', '#9B72AA', '#FF8787'];

export function ProductsByCountryChart({ products }: ProductsByCountryChartProps) {
  const data = useMemo(() => {
    const countryCounts = products.reduce((acc, product) => {
      acc[product.country] = (acc[product.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countryCounts)
      .map(([countryCode, count], index) => {
        const country = COUNTRIES.find((c) => c.code === countryCode);
        return {
          name: country?.name || countryCode,
          value: count,
          fill: COLORS[index % COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [products]);

  const chartConfig = useMemo(
    () =>
      data.reduce(
        (acc, item, index) => {
          acc[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length],
          };
          return acc;
        },
        {} as ChartConfig
      ),
    [data]
  );

  if (data.length === 0) {
    return <div className="h-[350px] flex items-center justify-center text-muted-foreground">No hay datos para mostrar</div>
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
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
  );
}
