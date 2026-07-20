import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle, MessageSquareWarning } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { MessagesClient } from './_components/messages-client';

export const metadata: Metadata = { title: 'Messages signalés' };

interface ReportedConversation {
  id: string;
  reportedAt?: string;
  createdAt: string;
  participants?: { id: string; prenom: string; name: string }[];
  lastMessage?: { content: string; createdAt: string };
  reportCount?: number;
}

async function MessagesContent() {
  try {
    const data = await api.get<{ data: ReportedConversation[]; total: number }>('/chat/reported');
    const conversations = Array.isArray(data) ? data : (data?.data ?? []);
    return <MessagesClient conversations={conversations} />;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les messages signalés : {msg}</span>
      </div>
    );
  }
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

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquareWarning className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages signalés</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Conversations signalées par les utilisateurs</p>
        </div>
      </div>
      <Suspense fallback={<MessagesSkeleton />}>
        <MessagesContent />
      </Suspense>
    </div>
  );
}
