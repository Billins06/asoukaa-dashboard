import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { getOrders } from '@/lib/orders/api';
import { parsePageParam } from '@/lib/format';
import { isOrderStatus } from '@/lib/status-meta';
import { OrdersClient } from './_components/orders-client';
import { OrdersTableSkeleton } from './_components/orders-skeleton';
import { OrdersTabs } from './_components/orders-tabs';

export const metadata: Metadata = { title: 'Commandes' };

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string; litige?: string }>;
}

async function OrdersContent({ searchParams }: PageProps) {
  const params = await searchParams;
  // Le filtre d'URL est la valeur EXACTE du serveur (« en cours », « expedié »…) ou « all ».
  const status = isOrderStatus(params.status) ? params.status : undefined;
  const page = parsePageParam(params.page);
  // Filtre « Litige ouvert » : ?litige=1 dans l'adresse.
  const disputeOnly = params.litige === '1';

  let data: Awaited<ReturnType<typeof getOrders>>;
  try {
    data = await getOrders({ status, page, limit: 20, disputeOuverte: disputeOnly });
  } catch (error) {
    unstable_rethrow(error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les commandes : {msg}</span>
      </div>
    );
  }

  return (
    <OrdersClient
      data={data}
      currentPage={page}
      activeStatus={status ?? 'all'}
      disputeOnly={disputeOnly}
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
      <OrdersTabs active="all" />
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersContent {...props} />
      </Suspense>
    </div>
  );
}
