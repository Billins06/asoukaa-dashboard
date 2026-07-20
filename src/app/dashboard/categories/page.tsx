import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { getCategoriesTree, getCategoriesFlat } from '@/lib/categories/api';
import { CategoriesClient } from './_components/categories-client';
import { CategoriesSkeleton } from './_components/categories-skeleton';

export const metadata: Metadata = { title: 'Catégories' };

async function CategoriesContent() {
  try {
    const [tree, flatList] = await Promise.all([
      getCategoriesTree(),
      getCategoriesFlat(),
    ]);
    return <CategoriesClient tree={tree} flatList={flatList} />;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les catégories : {msg}</span>
      </div>
    );
  }
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
