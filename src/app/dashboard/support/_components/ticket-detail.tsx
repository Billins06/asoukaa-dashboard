'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Lock, RefreshCw, RotateCcw, UserCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { assignTicketToMeAction, setTicketStatusAction } from '@/server/actions/support-actions';
import { personName, roleLabel } from '@/lib/support/meta';
import type { TicketDetail, TicketMessage, TicketStatus } from '@/lib/support/types';
import { TicketComposer } from './ticket-composer';
import { TicketImage } from './ticket-image';
import { TicketImageLightbox } from './ticket-image-lightbox';
import { TicketStatusBadge } from './ticket-status-badge';

interface TicketDetailViewProps {
  ticket: TicketDetail;
  currentAdminId: string | null;
  allowedImageHosts: string[];
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-[13px] break-words">{children}</div>
    </div>
  );
}

function MessageBubble({
  message,
  allowedHosts,
  onOpenImage,
}: {
  message: TicketMessage;
  allowedHosts: readonly string[];
  onOpenImage: (url: string) => void;
}) {
  const fromAdmin = message.authorType === 'admin';
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  return (
    <div className={cn('flex', fromAdmin ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] space-y-2 rounded-2xl px-3.5 py-2.5 sm:max-w-[75%]',
          fromAdmin
            ? 'rounded-br-sm border border-primary/25 bg-primary/10'
            : 'rounded-bl-sm border border-border bg-muted/50',
        )}
      >
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">{message.authorName}</span>
          {fromAdmin && <span>· Équipe</span>}
          <LocalDate iso={message.createdAt} />
        </p>
        {/* Texte brut : React échappe le contenu, jamais de HTML injecté. */}
        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{message.body}</p>
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((url, i) => (
              <TicketImage
                key={`${url}-${i}`}
                url={url}
                allowedHosts={allowedHosts}
                onOpen={onOpenImage}
                className="h-24 w-24"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TicketDetailView({ ticket, currentAdminId, allowedImageHosts }: TicketDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const closed = ticket.status === 'ferme';
  const isMine = !!currentAdminId && ticket.assignedAdmin?.id === currentAdminId;

  // Fait défiler la conversation vers le dernier message quand il en arrive un nouveau.
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(ticket.messages.length);
  useEffect(() => {
    if (ticket.messages.length > lastCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    lastCount.current = ticket.messages.length;
  }, [ticket.messages.length]);

  const changeStatus = (status: TicketStatus, success: string) =>
    startTransition(async () => {
      const r = await setTicketStatusAction(ticket.id, status);
      if (r.success) {
        toast.success(success);
        setConfirmClose(false);
      } else {
        toast.error(r.error);
      }
    });

  const assignToMe = () =>
    startTransition(async () => {
      const r = await assignTicketToMeAction(ticket.id);
      if (r.success) toast.success('Ticket assigné à vous');
      else toast.error(r.error);
    });

  const u = ticket.user;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] font-semibold">{ticket.reference}</span>
                <TicketStatusBadge status={ticket.status} />
                <Badge variant="outline" className="text-[11px]">
                  {ticket.category}
                </Badge>
                {ticket.adminHasUnread && (
                  <Badge variant="outline" className="border-[#FF6210]/40 bg-[#FF6210]/10 text-[11px] text-[#FF6210]">
                    Non lu
                  </Badge>
                )}
              </div>
              <h1 className="break-words text-xl font-bold tracking-tight">{ticket.subject}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                title="Actualiser"
                aria-label="Actualiser le ticket"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              {!isMine && (
                <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={isPending} onClick={assignToMe}>
                  <UserCheck className="h-3.5 w-3.5" />
                  Me l&apos;assigner
                </Button>
              )}
              {(ticket.status === 'ouvert' || ticket.status === 'en_cours') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  disabled={isPending}
                  onClick={() => changeStatus('resolu', 'Ticket marqué comme résolu')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Marquer comme résolu
                </Button>
              )}
              {ticket.status !== 'ferme' && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 gap-1.5"
                  disabled={isPending}
                  onClick={() => setConfirmClose(true)}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Fermer
                </Button>
              )}
              {(ticket.status === 'resolu' || ticket.status === 'ferme') && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5"
                  disabled={isPending}
                  onClick={() => changeStatus('en_cours', 'Ticket rouvert')}
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Rouvrir
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBlock label="Utilisateur">
              <p className="font-medium">{personName(u)}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {u.roles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">
                    {roleLabel(r)}
                  </Badge>
                ))}
                {!u.isActive && (
                  <Badge variant="destructive" className="text-[10px]">
                    Compte désactivé
                  </Badge>
                )}
              </div>
            </InfoBlock>

            <InfoBlock label="Contact">
              <p className="break-all">{u.email ?? '—'}</p>
              <p className="text-muted-foreground">{u.phone ?? 'Pas de téléphone'}</p>
            </InfoBlock>

            <InfoBlock label="Commande liée">
              {ticket.order ? (
                <>
                  <p className="font-mono text-[12px] font-medium">N° {ticket.order.orderNumber}</p>
                  <p className="text-[12px] text-muted-foreground">Statut : {ticket.order.status}</p>
                  <Link href="/dashboard/orders" className="text-[12px] text-primary hover:underline">
                    Voir les commandes
                  </Link>
                </>
              ) : ticket.orderId ? (
                <span className="text-muted-foreground">Commande introuvable</span>
              ) : (
                <span className="text-muted-foreground">Aucune</span>
              )}
            </InfoBlock>

            <InfoBlock label="Suivi">
              <p>
                Assigné à :{' '}
                <span className="font-medium">
                  {ticket.assignedAdmin ? (isMine ? 'Vous' : (ticket.assignedAdmin.name ?? 'Un administrateur')) : 'personne'}
                </span>
              </p>
              <p className="text-[12px] text-muted-foreground">
                Créé le <LocalDate iso={ticket.createdAt} />
              </p>
              {ticket.closedAt && (
                <p className="text-[12px] text-muted-foreground">
                  Fermé le <LocalDate iso={ticket.closedAt} />
                </p>
              )}
            </InfoBlock>
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <p className="text-[13px] font-semibold">
            Conversation · {ticket.messages.length} message{ticket.messages.length > 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.messages.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">Aucun message.</p>
          ) : (
            ticket.messages.map((m) => (
              <MessageBubble key={m.id} message={m} allowedHosts={allowedImageHosts} onOpenImage={setPreview} />
            ))
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {/* Réponse */}
      <Card>
        <CardHeader className="pb-0">
          <p className="text-[13px] font-semibold">Répondre</p>
        </CardHeader>
        <CardContent>
          {closed ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-3 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0" />
                Ce ticket est fermé : rouvrez-le avant de répondre.
              </span>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                disabled={isPending}
                onClick={() => changeStatus('en_cours', 'Ticket rouvert')}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Rouvrir
              </Button>
            </div>
          ) : (
            <TicketComposer ticketId={ticket.id} allowedHosts={allowedImageHosts} onOpenImage={setPreview} />
          )}
        </CardContent>
      </Card>

      <TicketImageLightbox url={preview} onClose={() => setPreview(null)} />

      <Dialog open={confirmClose} onOpenChange={(o) => !isPending && setConfirmClose(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fermer ce ticket ?</DialogTitle>
            <DialogDescription>
              Le ticket {ticket.reference} sera fermé. Il faudra le rouvrir pour pouvoir y répondre de nouveau.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClose(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => changeStatus('ferme', 'Ticket fermé')} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Fermer le ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
