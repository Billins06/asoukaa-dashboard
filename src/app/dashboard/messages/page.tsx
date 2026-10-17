import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { MessageSquareWarning } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { InlineError, errorMessage } from '@/components/inline-error';
import { getReportedConversations } from '@/lib/chat/api';
import { getUploadImageHosts } from '@/lib/support/api';
import { MessagesClient } from './_components/messages-client';

export const metadata: Metadata = { title: 'Messages signalés' };

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function MessagesContent({ page }: { page: number }) {
  let data;
  try {
    data = await getReportedConversations(page, 20);
  } catch (error) {
    unstable_rethrow(error);
    return (
      <InlineError title="Impossible de charger les messages signalés." message={errorMessage(error)} />
    );
  }
  return <MessagesClient data={data} currentPage={page} imageHosts={getUploadImageHosts()} />;
}

function MessagesSkeleton() {
  return (
    <Card><CardContent className="p-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </CardContent></Card>
  );
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '', 10) || 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquareWarning className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages signalés</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Conversations signalées par les utilisateurs</p>
        </div>
      </div>
      <Suspense key={`messages-${page}`} fallback={<MessagesSkeleton />}>
        <MessagesContent page={page} />
      </Suspense>
    </div>
  );
}
