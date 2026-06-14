import Link from 'next/link';
import { Trophy, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getTopProducts, getTopVendors } from '@/lib/dashboard/api';
import type { DashboardPeriod } from '@/lib/dashboard/types';
import { PERIOD_LABELS } from '@/lib/dashboard/types';
import { formatNumber, formatXOFCompact } from '../_lib/format';

const RANK_STYLES = [
  { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400', dot: 'bg-amber-400' },
  { badge: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400', dot: 'bg-zinc-400' },
  { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400', dot: 'bg-orange-400' },
];

export async function TopsSection({ period }: { period: DashboardPeriod }) {
  const [products, vendors] = await Promise.all([
    getTopProducts(period, 5),
    getTopVendors(period, 5),
  ]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* TOP PRODUITS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Top 5 produits
          </CardTitle>
          <CardDescription className="text-xs">
            Par quantité vendue — {PERIOD_LABELS[period]}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3">
          {products.length === 0 ? (
            <EmptyList message="Aucune vente sur cette période" />
          ) : (
            <ul className="space-y-0.5">
              {products.map((product, index) => (
                <li key={product.productId}>
                  <Link
                    href={`/dashboard/products/${product.productId}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent/60 transition-colors group"
                  >
                    <RankBadge index={index} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                        {product.productName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatNumber(product.totalSold)} vendu{product.totalSold > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold text-primary shrink-0">
                      {formatXOFCompact(product.totalRevenue)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* TOP BOUTIQUES */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Top 5 boutiques
          </CardTitle>
          <CardDescription className="text-xs">
            Par chiffre d'affaires — {PERIOD_LABELS[period]}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3">
          {vendors.length === 0 ? (
            <EmptyList message="Aucune vente sur cette période" />
          ) : (
            <ul className="space-y-0.5">
              {vendors.map((vendor, index) => (
                <li key={vendor.vendorId}>
                  <Link
                    href={`/dashboard/vendors/${vendor.vendorId}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent/60 transition-colors group"
                  >
                    <RankBadge index={index} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                        {vendor.shopName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatNumber(vendor.totalOrders)} commande{vendor.totalOrders > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold text-primary shrink-0">
                      {formatXOFCompact(vendor.totalRevenue)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RankBadge({ index }: { index: number }) {
  const style = RANK_STYLES[index];
  return (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
        style ? style.badge : 'bg-muted text-muted-foreground',
      )}
    >
      {index + 1}
    </span>
  );
}

function EmptyList({ message }: { message: string }) {
  return (
    <div className="h-32 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
