import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getOrders } from '@/lib/orders/api';
import { OrdersClient } from './_components/orders-client';
import { OrdersTableSkeleton } from './_components/orders-skeleton';
import type { OrderStatus } from '@/lib/orders/types';

export const metadata: Metadata = { title: 'Commandes' };

const VALID_STATUSES: OrderStatus[] = ['PENDING', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function OrdersContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawStatus = params.status ?? 'all';
  const page = Math.max(1, Number(params.page ?? '1'));
  const status = VALID_STATUSES.includes(rawStatus as OrderStatus)
    ? (rawStatus as OrderStatus)
    : undefined;

  const data = await getOrders({ status, page, limit: 20 });

  return (
    <OrdersClient
      data={data}
      currentPage={page}
      activeStatus={rawStatus}
    />
  );
}

export default function OrdersPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Gestion et suivi de toutes les commandes
        </p>
      </div>
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersContent {...props} />
      </Suspense>
    </div>
  );
}
