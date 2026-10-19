import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { unstable_rethrow } from 'next/navigation';
import { getBanners } from '@/lib/banners/api';
import { ApiError } from '@/lib/api';
import { BannersClient } from './_components/banners-client';
import { BannersSkeleton } from './_components/banners-skeleton';

export const metadata: Metadata = { title: 'Bannières' };

function loadErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "la route n'existe pas (encore) côté serveur.";
  }
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

async function BannersContent() {
  let banners;
  try {
    banners = await getBanners();
  } catch (error) {
    unstable_rethrow(error);
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les bannières : {loadErrorMessage(error)}</span>
      </div>
    );
  }
  return <BannersClient banners={banners} />;
}

export default function BannersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bannières</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Bannières qui défilent en haut de l&apos;accueil de l&apos;application, dans l&apos;ordre ci-dessous
        </p>
      </div>

      <Suspense fallback={<BannersSkeleton />}>
        <BannersContent />
      </Suspense>
    </div>
  );
}
