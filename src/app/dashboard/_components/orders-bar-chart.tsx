'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RevenuePoint } from '@/lib/dashboard/types';
import { formatChartDate } from '../_lib/format';

export function OrdersBarChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
          strokeOpacity={0.6}
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatChartDate}
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-muted)', opacity: 0.4, radius: 4 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as RevenuePoint;
            return (
              <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 shadow-lg text-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  {formatChartDate(String(label))}
                </p>
                <p className="font-bold text-info">
                  {point.orderCount} commande{point.orderCount > 1 ? 's' : ''}
                </p>
              </div>
            );
          }}
        />
        <Bar
          dataKey="orderCount"
          fill="hsl(217 91% 60%)"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
          animationDuration={500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
