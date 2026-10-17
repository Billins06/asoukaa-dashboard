import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { unstable_rethrow } from 'next/navigation';
import { getBandeau, getRayons } from '@/lib/vitrine/api';
import { ApiError } from '@/lib/api';
import { BandeauSection } from './_components/bandeau-section';
import { VitrineTabs } from './_components/vitrine-tabs';
import { RayonsClient } from './_components/rayons-client';
import { BandeauSkeleton, RayonsSkeleton } from './_components/vitrine-skeleton';

export const metadata: Metadata = { title: 'Vitrine' };

function loadErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "la route n'existe pas (encore) côté serveur.";
  }
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

async function BandeauContent() {
  let bandeau;
  try {
    bandeau = await getBandeau();
  } catch (error) {
    unstable_rethrow(error);
    return <ErrorBox>Impossible de charger le bandeau : {loadErrorMessage(error)}</ErrorBox>;
  }
  // key : réinitialise le formulaire avec les valeurs serveur après chaque enregistrement
  return <BandeauSection key={bandeau?.updatedAt ?? 'aucun'} bandeau={bandeau} />;
}

async function RayonsContent() {
  let rayons;
  try {
    rayons = await getRayons();
  } catch (error) {
    unstable_rethrow(error);
    return <ErrorBox>Impossible de charger les rayons : {loadErrorMessage(error)}</ErrorBox>;
  }
  return <RayonsClient rayons={rayons} />;
}

export default function VitrinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vitrine</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Bandeau « Pour vous » et rayons mis en avant sur l&apos;accueil de l&apos;application
        </p>
      </div>

      <VitrineTabs active="rayons" />

      <Suspense fallback={<BandeauSkeleton />}>
        <BandeauContent />
      </Suspense>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Rayons</h2>
          <p className="text-[12px] text-muted-foreground">
            Sélections de produits (ventes flash, tendances…) affichées dans l&apos;ordre ci-dessous
          </p>
        </div>
        <Suspense fallback={<RayonsSkeleton />}>
          <RayonsContent />
        </Suspense>
      </section>
    </div>
  );
}
