import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { InlineError, errorMessage } from '@/components/inline-error';
import { getExpressDeliveries } from '@/lib/express-deliveries/api';
import { parsePageParam } from '@/lib/format';
import { ExpressClient } from './_components/express-client';
import { ExpressSkeleton } from './_components/express-skeleton';

export const metadata: Metadata = { title: 'Courses express' };

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    payment?: string;
    refund?: string;
    attention?: string;
    page?: string;
  }>;
}

const STATUSES = [
  'en attente',
  'contre-proposition',
  'paiement en attente',
  'accepté',
  'en cours de livraison',
  'livré',
  'annulée',
];
const PAYMENTS = ['en attente', 'success', 'échoué', 'à vérifier', 'none'];
const REFUNDS = ['à rembourser', 'remboursé'];

async function ExpressContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const q = (params.q ?? '').trim().slice(0, 100);
  const status = params.status && STATUSES.includes(params.status) ? params.status : '';
  const payment = params.payment && PAYMENTS.includes(params.payment) ? params.payment : '';
  const refund = params.refund && REFUNDS.includes(params.refund) ? params.refund : '';
  const attention = params.attention === 'true';

  let data;
  try {
    data = await getExpressDeliveries({
      search: q || undefined,
      status: status || undefined,
      paymentStatus: payment || undefined,
      refundStatus: refund || undefined,
      attention,
      page,
      limit: 20,
    });
  } catch (error) {
    unstable_rethrow(error);
    return <InlineError title="Impossible de charger les courses express." message={errorMessage(error)} />;
  }

  return (
    <ExpressClient
      data={data}
      filters={{ q, status, payment, refund, attention: attention ? 'true' : '' }}
    />
  );
}

export default async function ExpressDeliveriesPage(props: PageProps) {
  const key = JSON.stringify(await props.searchParams);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Courses express</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Suivi des courses entre particuliers — paiements à vérifier, annulations et remboursements
        </p>
      </div>
      <Suspense key={key} fallback={<ExpressSkeleton />}>
        <ExpressContent {...props} />
      </Suspense>
    </div>
  );
}
