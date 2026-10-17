import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { InlineError, errorMessage } from '@/components/inline-error';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getFournisseurs } from '@/lib/fournisseurs/api';
import { SuppliersClient } from './_components/suppliers-client';

export const metadata: Metadata = { title: 'Fournisseurs' };

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function SuppliersContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '', 10) || 1);

  let data;
  try {
    data = await getFournisseurs({ page, limit: 20 });
  } catch (error) {
    unstable_rethrow(error);
    return <InlineError title="Impossible de charger les fournisseurs." message={errorMessage(error)} />;
  }
  return <SuppliersClient data={data} currentPage={page} />;
}

function SuppliersSkeleton() {
  return (
    <Card><CardContent className="p-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-32 hidden sm:block" />
          <Skeleton className="h-4 w-28 hidden sm:block" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-7 w-20 ml-auto" />
        </div>
      ))}
    </CardContent></Card>
  );
}

export default function SuppliersPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fournisseurs</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Gestion des fournisseurs et partenaires logistiques</p>
      </div>
      <Suspense fallback={<SuppliersSkeleton />}>
        <SuppliersContent {...props} />
      </Suspense>
    </div>
  );
}
