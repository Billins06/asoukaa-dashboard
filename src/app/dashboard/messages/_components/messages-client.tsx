'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquareWarning,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  RefreshCw,
  Store,
  User,
  X,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InlineError } from '@/components/inline-error';
import { LocalDate } from '@/components/local-date';
import { SESSION_EXPIRED_ROUTE } from '@/lib/constants';
import { resolveMedia } from '@/lib/media/safe-media';
import {
  blockReasonLabel,
  chatUserName,
  type ReportedConversation,
  type ReportedConversationsPage,
  type ReportedMessage,
} from '@/lib/chat/types';

interface MessagesClientProps {
  data: ReportedConversationsPage;
  currentPage: number;
  /** Hôtes autorisés pour les images (UPLOAD_IMAGE_HOSTS, lu côté serveur). */
  imageHosts: string[];
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; messages: ReportedMessage[] };

function senderRole(message: ReportedMessage, conv: ReportedConversation): string | null {
  if (message.senderId === conv.clientId) return 'Client';
  if (conv.vendor?.user?.id && message.senderId === conv.vendor.user.id) return 'Vendeur';
  return null;
}

function MessageImage({ url, hosts }: { url: string; hosts: readonly string[] }) {
  const media = resolveMedia(url, 'chat', hosts);
  if (!media) {
    // Adresse non reconnue (pas un fichier émis par notre serveur) : jamais affichée ni ouverte.
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1 text-[12px] text-muted-foreground">
        <ImageOff className="h-3.5 w-3.5" />
        Image non affichée (adresse non reconnue)
      </p>
    );
  }
  return (
    <a href={media.src} target="_blank" rel="noopener noreferrer" className="mt-1.5 block w-fit">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.src}
        alt="Image envoyée dans la conversation"
        loading="lazy"
        referrerPolicy="no-referrer"
        className="max-h-48 max-w-full rounded-lg border border-border object-contain"
      />
    </a>
  );
}

function ConversationMessages({
  conversation,
  hosts,
  onClose,
}: {
  conversation: ReportedConversation;
  hosts: readonly string[];
  onClose: () => void;
}) {
  const conversationId = conversation.id;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/chat-messages?id=${encodeURIComponent(conversationId)}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (res.status === 401) {
          // Session expirée : la route efface le cookie puis renvoie vers /login.
          window.location.assign(SESSION_EXPIRED_ROUTE);
          return;
        }
        const body: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
              ? (body as { error: string }).error
              : `Erreur ${res.status}`;
          setState({ status: 'error', message: msg });
          return;
        }
        const list = Array.isArray(body) ? body : [];
        setState({ status: 'ok', messages: list as ReportedMessage[] });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          message: err instanceof Error && err.message ? err.message : 'Le serveur ne répond pas.',
        });
      }
    })();

    return () => controller.abort();
  }, [conversationId, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  return (
    <Card className="mt-2">
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-[14px]">Messages signalés de la conversation</CardTitle>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose} aria-label="Fermer">
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {state.status === 'loading' ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-[13px]">Chargement...</span>
          </div>
        ) : state.status === 'error' ? (
          <div className="space-y-3 p-4">
            <InlineError title="Impossible de charger les messages." message={state.message} />
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={retry}>
              <RefreshCw className="h-3.5 w-3.5" />
              Réessayer
            </Button>
          </div>
        ) : state.messages.length === 0 ? (
          <p className="text-center text-[13px] text-muted-foreground py-8">Aucun message signalé</p>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {state.messages.map((m) => {
              const role = senderRole(m, conversation);
              return (
                <div key={m.id} className={`px-4 py-3 ${m.isReported ? 'bg-destructive/5' : ''}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-[12px] font-medium">
                      {chatUserName(m.sender)}
                      {role && <span className="ml-1.5 text-muted-foreground font-normal">({role})</span>}
                      {m.sender?.email && (
                        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{m.sender.email}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {m.isBlocked && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 bg-amber-500/5">
                          Bloqué : {blockReasonLabel(m.blockReason)}
                        </Badge>
                      )}
                      {m.isReported && (
                        <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive bg-destructive/5">
                          Signalé
                        </Badge>
                      )}
                      <LocalDate iso={m.createdAt} className="text-[11px] text-muted-foreground" />
                    </span>
                  </div>
                  {/* Texte brut : écrit par un utilisateur, jamais interprété comme du HTML */}
                  {m.content && <p className="whitespace-pre-wrap break-words text-[13px]">{m.content}</p>}
                  {m.imageUrl && <MessageImage url={m.imageUrl} hosts={hosts} />}
                  {!m.content && !m.imageUrl && (
                    <p className="text-[12px] italic text-muted-foreground">Message vide</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MessagesClient({ data, currentPage, imageHosts }: MessagesClientProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const conversations = data.data;

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(Math.max(1, p)));
    router.push(url.pathname + url.search);
  };

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <MessageSquareWarning className="h-8 w-8 opacity-30" />
          <p className="text-sm">Aucun message signalé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[13px] text-muted-foreground">
        {data.total} conversation{data.total > 1 ? 's' : ''} avec au moins un message signalé
      </p>

      {conversations.map((conv) => {
        const isOpen = expanded === conv.id;
        const shopName = conv.vendor?.shopName?.trim() || 'Boutique inconnue';
        return (
          <div key={conv.id}>
            <Card className={isOpen ? 'ring-1 ring-ring' : ''}>
              <CardContent className="p-0">
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <MessageSquareWarning className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="flex items-center gap-1.5 text-[13px] font-medium">
                      <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{chatUserName(conv.client)}</span>
                      {conv.client?.email && (
                        <span className="hidden truncate text-[11px] font-normal text-muted-foreground md:inline">
                          {conv.client.email}
                        </span>
                      )}
                    </p>
                    <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Store className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {shopName}
                        {conv.vendor?.user && <> · {chatUserName(conv.vendor.user)}</>}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {conv.isArchived && (
                      <Badge variant="outline" className="text-[10px]">Archivée</Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground hidden sm:block">
                      <LocalDate iso={conv.updatedAt} pattern="d MMM yyyy HH:mm" />
                    </span>
                    <Button
                      size="sm"
                      variant={isOpen ? 'secondary' : 'outline'}
                      className="h-7 gap-1 px-2 text-[12px]"
                      onClick={() => setExpanded(isOpen ? null : conv.id)}
                      aria-expanded={isOpen}
                    >
                      Voir les messages
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {isOpen && (
              <ConversationMessages
                key={conv.id}
                conversation={conv}
                hosts={imageHosts}
                onClose={() => setExpanded(null)}
              />
            )}
          </div>
        );
      })}

      {data.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[12px] text-muted-foreground">
            Page {currentPage} sur {data.pages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Page précédente"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Page suivante"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= data.pages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
