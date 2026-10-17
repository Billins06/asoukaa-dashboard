import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { InlineError, errorMessage } from '@/components/inline-error';
import { getCategoriesTree, getCategoriesFlat } from '@/lib/categories/api';
import { CategoriesClient } from './_components/categories-client';
import { CategoriesSkeleton } from './_components/categories-skeleton';

export const metadata: Metadata = { title: 'Catégories' };

async function CategoriesContent() {
  let tree, flatList;
  try {
    [tree, flatList] = await Promise.all([getCategoriesTree(), getCategoriesFlat()]);
  } catch (error) {
    unstable_rethrow(error);
    return <InlineError title="Impossible de charger les catégories." message={errorMessage(error)} />;
  }
  return <CategoriesClient tree={tree} flatList={flatList} />;
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catégories</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Arborescence des catégories produits (3 niveaux max)
        </p>
      </div>
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}
