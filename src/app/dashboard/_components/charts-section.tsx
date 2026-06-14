import { TrendingUp, BarChart3 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRevenueChart } from '@/lib/dashboard/api';
import type { DashboardPeriod } from '@/lib/dashboard/types';
import { PERIOD_LABELS } from '@/lib/dashboard/types';
import { fillMissingDays } from '../_lib/format';
import { RevenueAreaChart } from './revenue-area-chart';
import { OrdersBarChart } from './orders-bar-chart';

export async function ChartsSection({ period }: { period: DashboardPeriod }) {
  const raw = await getRevenueChart(period);
  const data = fillMissingDays(raw, period);

  const isEmpty = data.every((d) => d.revenue === 0 && d.orderCount === 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Chiffre d'affaires
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">{PERIOD_LABELS[period]}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isEmpty ? (
            <EmptyChart message="Aucune vente sur cette période" />
          ) : (
            <RevenueAreaChart data={data} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-info" />
                Volume de commandes
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">{PERIOD_LABELS[period]}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isEmpty ? (
            <EmptyChart message="Aucune commande sur cette période" />
          ) : (
            <OrdersBarChart data={data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[260px] flex flex-col items-center justify-center gap-2">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <BarChart3 className="h-5 w-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
