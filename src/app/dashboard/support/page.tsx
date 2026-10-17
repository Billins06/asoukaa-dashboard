import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { unstable_rethrow } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getTicketStats, getTickets } from '@/lib/support/api';
import { TICKET_CATEGORIES, TICKET_STATUSES, type TicketStatus } from '@/lib/support/types';
import { SupportClient } from './_components/support-client';
import { SupportSkeleton } from './_components/support-skeleton';

export const metadata: Metadata = { title: 'Support' };

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string; search?: string; page?: string }>;
}

function loadErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "la route n'existe pas (encore) côté serveur.";
  }
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

async function SupportContent({ searchParams }: PageProps) {
  const params = await searchParams;

  const status = TICKET_STATUSES.includes(params.status as TicketStatus)
    ? (params.status as TicketStatus)
    : undefined;
  const category = (TICKET_CATEGORIES as readonly string[]).includes(params.category ?? '')
    ? params.category
    : undefined;
  const search = (params.search ?? '').trim().slice(0, 100);
  const page = Math.min(Math.max(1, parseInt(params.page ?? '', 10) || 1), 10_000);

  let list;
  let stats;
  try {
    [list, stats] = await Promise.all([
      getTickets({ status, category, search: search || undefined, page, limit: 20 }),
      getTicketStats().catch((e: unknown) => {
        unstable_rethrow(e); // la redirection « session expirée » ne doit pas être avalée
        return null; // les cartes restent facultatives
      }),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les tickets : {loadErrorMessage(error)}</span>
      </div>
    );
  }
  return (
    <SupportClient
      data={list}
      stats={stats}
      currentPage={page}
      filters={{ status: status ?? 'all', category: category ?? 'all', search }}
    />
  );
}

export default function SupportPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Tickets envoyés par les utilisateurs de l&apos;application, triés par dernière activité
        </p>
      </div>
      <Suspense fallback={<SupportSkeleton />}>
        <SupportContent {...props} />
      </Suspense>
    </div>
  );
}
