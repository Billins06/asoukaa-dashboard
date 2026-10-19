import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { InlineError, errorMessage } from '@/components/inline-error';
import { getAdminProducts } from '@/lib/products/api';
import { parsePageParam } from '@/lib/format';
import { ProductsClient } from './_components/products-client';
import { ProductsSkeleton } from './_components/products-skeleton';

export const metadata: Metadata = { title: 'Produits' };

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    blocked?: string;
    page?: string;
  }>;
}

const STATUSES = ['active', 'inactive', 'brouillon', 'out_of_stock'];

async function ProductsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const q = (params.q ?? '').trim().slice(0, 100);
  const status = params.status && STATUSES.includes(params.status) ? params.status : '';
  const type = params.type === 'book' || params.type === 'physical' ? params.type : '';
  const blocked = params.blocked === 'true' ? true : undefined;

  let data;
  try {
    data = await getAdminProducts({
      search: q || undefined,
      status: status || undefined,
      isDigital: type === 'book' ? true : type === 'physical' ? false : undefined,
      blocked,
      page,
      limit: 20,
    });
  } catch (error) {
    unstable_rethrow(error);
    return <InlineError title="Impossible de charger les produits." message={errorMessage(error)} />;
  }

  return (
    <ProductsClient
      data={data}
      filters={{ q, status, type, blocked: blocked ? 'true' : '' }}
    />
  );
}

export default async function ProductsPage(props: PageProps) {
  // La clé du Suspense change avec les filtres : le squelette s'affiche à chaque changement.
  const key = JSON.stringify(await props.searchParams);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Tous les produits et livres de la marketplace — consultation, désactivation et réactivation
        </p>
      </div>
      <Suspense key={key} fallback={<ProductsSkeleton />}>
        <ProductsContent {...props} />
      </Suspense>
    </div>
  );
}
