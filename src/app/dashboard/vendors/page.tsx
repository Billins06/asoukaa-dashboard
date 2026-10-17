import type { Metadata } from 'next';
import { Suspense } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { InlineError, errorMessage } from '@/components/inline-error';
import { getVendors, getPendingVendors } from '@/lib/vendors/api';
import { VendorsClient } from './_components/vendors-client';
import { VendorsTableSkeleton } from './_components/vendors-skeleton';

export const metadata: Metadata = { title: 'Vendeurs' };

interface PageProps {
  searchParams: Promise<{ tab?: string; page?: string }>;
}

export default async function VendorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab === 'pending' ? 'pending' : 'all';
  const page = Math.max(1, parseInt(params.page ?? '', 10) || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendeurs</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Validation et gestion des comptes vendeurs
        </p>
      </div>

      <Suspense key={`vendors-${tab}-${page}`} fallback={<VendorsTableSkeleton />}>
        <VendorsDataServer tab={tab} page={page} />
      </Suspense>
    </div>
  );
}

async function VendorsDataServer({ tab, page }: { tab: string; page: number }) {
  let allData, pendingData;
  try {
    [allData, pendingData] = await Promise.all([
      getVendors(undefined, page, 20),
      getPendingVendors(),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    return <InlineError title="Impossible de charger les vendeurs." message={errorMessage(error)} />;
  }
  return (
    <VendorsClient
      allData={allData}
      pendingData={Array.isArray(pendingData) ? pendingData : []}
      activeTab={tab}
      currentPage={page}
    />
  );
}
