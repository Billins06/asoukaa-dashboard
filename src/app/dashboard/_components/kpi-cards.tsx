import Link from 'next/link';
import {
  Banknote,
  HandCoins,
  ShoppingCart,
  PackageOpen,
  Store,
  Truck,
  Star,
  Users,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getAdminOverview } from '@/lib/dashboard/api';
import type { DashboardPeriod } from '@/lib/dashboard/types';
import { formatNumber, formatXOFCompact } from '../_lib/format';

interface KpiItem {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  stripe?: string;
  href?: string;
  alert?: boolean;
}

export async function KpiCards({ period }: { period: DashboardPeriod }) {
  const overview = await getAdminOverview(period);
  const { counters, period: stats } = overview;

  const inProgressOrders = stats.ordersByStatus
    .filter((s) => ['pending', 'preparing', 'shipped'].includes(s.status))
    .reduce((sum, s) => sum + Number(s.count), 0);

  const kpis: KpiItem[] = [
    {
      label: "Chiffre d'affaires",
      value: formatXOFCompact(stats.totalRevenue),
      icon: Banknote,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      stripe: 'from-primary/20 to-primary/5',
    },
    {
      label: 'Commissions Asoukaa',
      value: formatXOFCompact(stats.totalCommissions),
      icon: HandCoins,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      stripe: 'from-success/20 to-success/5',
    },
    {
      label: 'Commandes',
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
    },
    {
      label: 'Commandes en cours',
      value: formatNumber(inProgressOrders),
      icon: PackageOpen,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      href: '/dashboard/orders?status=in_progress',
    },
    {
      label: 'Vendeurs à valider',
      value: formatNumber(counters.pendingVendors),
      icon: Store,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      href: '/dashboard/vendors?status=en_attente',
      alert: counters.pendingVendors > 0,
    },
    {
      label: 'Livreurs à valider',
      value: formatNumber(counters.pendingAgents),
      icon: Truck,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      href: '/dashboard/agents?status=en_attente',
      alert: counters.pendingAgents > 0,
    },
    {
      label: 'Avis à modérer',
      value: formatNumber(counters.pendingReviews),
      icon: Star,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      href: '/dashboard/reviews?status=pending',
      alert: counters.pendingReviews > 0,
    },
    {
      label: 'Utilisateurs inscrits',
      value: formatNumber(counters.totalUsers),
      icon: Users,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;

        const inner = (
          <Card
            className={cn(
              'relative overflow-hidden transition-all duration-200 hover:shadow-sm',
              kpi.href && 'hover:shadow-md hover:-translate-y-px cursor-pointer',
              kpi.alert && 'ring-1 ring-warning/40',
            )}
          >
            {kpi.stripe && (
              <div
                className={cn('absolute inset-x-0 top-0 h-0.5 bg-linear-to-r', kpi.stripe)}
              />
            )}

            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('p-2 rounded-lg shrink-0', kpi.iconBg)}>
                  <Icon className={cn('h-4 w-4', kpi.iconColor)} />
                </div>
                {kpi.alert ? (
                  <span className="relative flex h-2 w-2 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-warning" />
                  </span>
                ) : kpi.href ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                ) : null}
              </div>

              <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-none">{kpi.label}</p>
            </CardContent>
          </Card>
        );

        return kpi.href ? (
          <Link key={kpi.label} href={kpi.href} className="block h-full">
            {inner}
          </Link>
        ) : (
          <div key={kpi.label} className="h-full">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
