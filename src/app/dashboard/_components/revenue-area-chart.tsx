'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RevenuePoint } from '@/lib/dashboard/types';
import { formatChartDate, formatXOF, formatXOFCompact } from '../_lib/format';

export function RevenueAreaChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(25 100% 50%)" stopOpacity={0.2} />
            <stop offset="85%" stopColor="hsl(25 100% 50%)" stopOpacity={0} />
          </linearGradient>
        </defs>

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
          tickFormatter={(v: number) => formatXOFCompact(v)}
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          width={68}
        />
        <Tooltip
          cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as RevenuePoint;
            return (
              <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 shadow-lg text-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  {formatChartDate(String(label))}
                </p>
                <p className="font-bold text-primary">{formatXOF(point.revenue)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {point.orderCount} commande{point.orderCount > 1 ? 's' : ''}
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(25 100% 50%)"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(25 100% 50%)', strokeWidth: 0 }}
          animationDuration={500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
