import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { getTicket, getUploadImageHosts } from '@/lib/support/api';
import { TicketDetailView } from '../_components/ticket-detail';
import { TicketDetailSkeleton } from '../_components/ticket-detail-skeleton';

export const metadata: Metadata = { title: 'Ticket de support' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ id: string }>;
}

async function TicketContent({ id }: { id: string }) {
  let ticket;
  try {
    ticket = await getTicket(id);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          Impossible de charger le ticket : {error instanceof Error ? error.message : 'Erreur inconnue'}
        </span>
      </div>
    );
  }
  const me = await getCurrentUser();
  return (
    <TicketDetailView ticket={ticket} currentAdminId={me?.id ?? null} allowedImageHosts={getUploadImageHosts()} />
  );
}

export default async function TicketPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux tickets
      </Link>
      <Suspense fallback={<TicketDetailSkeleton />}>
        <TicketContent id={id} />
      </Suspense>
    </div>
  );
}
