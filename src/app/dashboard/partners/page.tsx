import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { InlineError, errorMessage } from '@/components/inline-error';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getPartners } from '@/lib/partners/api';
import { PartnersClient } from './_components/partners-client';

export const metadata: Metadata = { title: 'Partenaires' };

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function PartnersContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '', 10) || 1);

  let data;
  try {
    data = await getPartners({ page, limit: 20 });
  } catch (error) {
    unstable_rethrow(error);
    return <InlineError title="Impossible de charger les partenaires." message={errorMessage(error)} />;
  }
  return <PartnersClient data={data} currentPage={page} />;
}

function PartnersSkeleton() {
  return (
    <Card><CardContent className="p-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 flex-1 max-w-[180px]" />
          <Skeleton className="h-4 w-32 hidden md:block" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-7 w-20 ml-auto" />
        </div>
      ))}
    </CardContent></Card>
  );
}

export default function PartnersPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Partenaires</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Gestion des partenaires Asoukaa</p>
      </div>
      <Suspense fallback={<PartnersSkeleton />}>
        <PartnersContent {...props} />
      </Suspense>
    </div>
  );
}
