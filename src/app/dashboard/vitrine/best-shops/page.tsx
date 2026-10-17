import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { unstable_rethrow } from 'next/navigation';
import { getBestShops } from '@/lib/vitrine/api';
import { ApiError } from '@/lib/api';
import { VitrineTabs } from '../_components/vitrine-tabs';
import { BestShopsClient } from './_components/best-shops-client';
import { BestShopsSkeleton } from './_components/best-shops-skeleton';

export const metadata: Metadata = { title: 'Meilleures boutiques' };

function loadErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "la route n'existe pas (encore) côté serveur.";
  }
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

async function BestShopsContent() {
  let shops;
  try {
    shops = await getBestShops();
  } catch (error) {
    unstable_rethrow(error);
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les meilleures boutiques : {loadErrorMessage(error)}</span>
      </div>
    );
  }
  return <BestShopsClient shops={shops} />;
}

export default function BestShopsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vitrine</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Bandeau « Pour vous », rayons et boutiques mises en avant sur l&apos;accueil de l&apos;application
        </p>
      </div>

      <VitrineTabs active="best-shops" />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Meilleures boutiques</h2>
          <p className="text-[12px] text-muted-foreground">
            Seules ces boutiques s&apos;affichent dans Meilleures boutiques sur l&apos;accueil de l&apos;application.
          </p>
        </div>
        <Suspense fallback={<BestShopsSkeleton />}>
          <BestShopsContent />
        </Suspense>
      </section>
    </div>
  );
}
