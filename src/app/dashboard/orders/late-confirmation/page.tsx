import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { getLateConfirmationOrders } from '@/lib/orders/api';
import type { LateConfirmationLevel } from '@/lib/orders/types';
import { parsePageParam } from '@/lib/format';
import { OrdersTabs } from '../_components/orders-tabs';
import { OrdersTableSkeleton } from '../_components/orders-skeleton';
import { LateConfirmationClient } from './_components/late-confirmation-client';

export const metadata: Metadata = { title: 'Commandes à confirmer' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  searchParams: Promise<{ level?: string; page?: string; vendorId?: string }>;
}

function loadErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "la route n'existe pas (encore) côté serveur.";
  }
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

async function LateContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const level: LateConfirmationLevel = params.level === 'alert' ? 'alert' : 'reminder';
  const vendorId = params.vendorId && UUID_RE.test(params.vendorId) ? params.vendorId : undefined;
  const page = parsePageParam(params.page);

  let data;
  try {
    data = await getLateConfirmationOrders({ level, vendorId, page, limit: 20 });
  } catch (error) {
    unstable_rethrow(error);
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les commandes à confirmer : {loadErrorMessage(error)}</span>
      </div>
    );
  }
  return <LateConfirmationClient data={data} currentPage={page} level={level} vendorId={vendorId ?? null} />;
}

export default function LateConfirmationPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Gestion et suivi de toutes les commandes</p>
      </div>
      <OrdersTabs active="late" />
      <Suspense fallback={<OrdersTableSkeleton />}>
        <LateContent {...props} />
      </Suspense>
    </div>
  );
}
