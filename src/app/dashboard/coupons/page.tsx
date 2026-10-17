import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { InlineError, errorMessage } from '@/components/inline-error';
import { getCoupons } from '@/lib/coupons/api';
import { CouponsClient } from './_components/coupons-client';
import { CouponsSkeleton } from './_components/coupons-skeleton';

export const metadata: Metadata = { title: 'Coupons' };

interface PageProps {
  searchParams: Promise<{ filter?: string; page?: string }>;
}

async function CouponsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = params.filter ?? 'all';
  const page = Math.max(1, parseInt(params.page ?? '', 10) || 1);

  const isActive =
    filter === 'active' ? true : filter === 'inactive' ? false : undefined;

  let data;
  try {
    data = await getCoupons({ isActive, page, limit: 20 });
  } catch (error) {
    unstable_rethrow(error);
    return <InlineError title="Impossible de charger les coupons." message={errorMessage(error)} />;
  }

  return <CouponsClient data={data} currentPage={page} activeFilter={filter} />;
}

export default function CouponsPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Création et gestion des codes promotionnels
        </p>
      </div>
      <Suspense fallback={<CouponsSkeleton />}>
        <CouponsContent {...props} />
      </Suspense>
    </div>
  );
}
