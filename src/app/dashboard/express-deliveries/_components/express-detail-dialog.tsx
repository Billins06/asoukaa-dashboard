'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LocalDate } from '@/components/local-date';
import { formatFCFA } from '@/lib/format';
import {
  getExpressDetailAction,
  resolveExpressPaymentAction,
  cancelExpressAction,
  markExpressRefundedAction,
} from '@/server/actions/express-deliveries-actions';
import type { ExpressDetail } from '@/lib/express-deliveries/types';
import { StatusBadge } from './express-status-badge';

const DELAI_LABEL: Record<string, string> = {
  normal: 'Dans la journée',
  urgent: '2 à 3 h',
  express: 'Moins d\'1 h',
};
const PAYMENT_LABEL: Record<string, string> = {
  success: 'Payé',
  'en attente': 'En attente',
  'échoué': 'Échoué',
  'à vérifier': 'À vérifier',
};

type Mode = null | 'paid' | 'failed' | 'cancel' | 'refunded';

const MODE_TEXT: Record<Exclude<Mode, null>, { title: string; help: string; cta: string; needsText: boolean; danger: boolean }> = {
  paid: {
    title: 'Paiement reçu',
    help: 'Vous avez vu l\'argent sur FeexPay / Mobile Money. La course est lancée et le livreur est prévenu.',
    cta: 'Confirmer : paiement reçu',
    needsText: false,
    danger: false,
  },
  failed: {
    title: 'Paiement non reçu',
    help: 'Aucun argent reçu. Le client peut réessayer pendant 5 minutes, puis la course est remise en circulation.',
    cta: 'Confirmer : paiement non reçu',
    needsText: false,
    danger: true,
  },
  cancel: {
    title: 'Annuler la course',
    help: 'Le client et le livreur sont prévenus (le motif leur est envoyé). Si la course était payée, un remboursement « à faire » est créé.',
    cta: 'Annuler la course',
    needsText: true,
    danger: true,
  },
  refunded: {
    title: 'Remboursement effectué',
    help: 'À cliquer seulement après avoir rendu l\'argent au client (FeexPay / Mobile Money). Le client est prévenu.',
    cta: 'Marquer comme remboursé',
    needsText: false,
    danger: false,
  },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </>
  );
}

export function ExpressDetailButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [d, setD] = useState<ExpressDetail | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getExpressDetailAction(id);
      if (r.success) setD(r.data);
      else setError(r.error);
    } catch {
      setError('Le serveur ne répond pas. Réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = () => {
    setOpen(true);
    setMode(null);
    setText('');
    setD(null);
    void load();
  };

  const submit = () => {
    if (!mode) return;
    const meta = MODE_TEXT[mode];
    if (meta.needsText && text.trim().length < 3) {
      toast.error('Indiquez le motif (3 caractères minimum).');
      return;
    }
    startTransition(async () => {
      try {
        const r =
          mode === 'paid' || mode === 'failed'
            ? await resolveExpressPaymentAction(id, mode, text.trim() || undefined)
            : mode === 'cancel'
              ? await cancelExpressAction(id, text.trim())
              : await markExpressRefundedAction(id, text.trim() || undefined);
        if (r.success) {
          toast.success('Enregistré.');
          setMode(null);
          setText('');
          await load();
          router.refresh();
        } else {
          toast.error(r.error);
          // La course a peut-être changé entre-temps : on recharge l'état réel.
          setMode(null);
          setText('');
          await load();
          router.refresh();
        }
      } catch {
        toast.error('Le serveur ne répond pas. Réessayez dans un instant.');
      }
    });
  };

  const choose = (m: Mode) => {
    setText('');
    setMode(m);
  };

  const canResolve = d?.paymentStatus === 'à vérifier' && d.status === 'paiement en attente';
  const canRefund = d?.refundStatus === 'à rembourser';
  const canCancel =
    !!d &&
    d.status !== 'livré' &&
    d.status !== 'annulée' &&
    d.paymentStatus !== 'à vérifier' &&
    d.paymentStatus !== 'en attente';

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-muted-foreground"
        title="Voir la course"
        aria-label="Voir la course"
        onClick={openDialog}
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Course express</DialogTitle>
            <DialogDescription className="font-mono text-[11px] break-all">{id}</DialogDescription>
          </DialogHeader>

          {loading && !d && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && <p className="text-[13px] text-destructive">{error}</p>}

          {d && (
            <div className="space-y-4 text-[13px]">
              <StatusBadge d={d} />

              {d.paymentStatus === 'à vérifier' && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                  Le résultat du paiement est incertain. Vérifiez sur FeexPay (réf. ci-dessous), puis dites
                  si l&apos;argent est arrivé.
                </div>
              )}
              {d.cancelReason && (
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <span className="text-muted-foreground">Motif d&apos;annulation : </span>
                  {d.cancelReason}
                </div>
              )}

              <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2">
                <Row label="Client">
                  {d.requester ? `${d.requester.name}${d.requester.phone ? ` · ${d.requester.phone}` : ''}` : '—'}
                </Row>
                <Row label="Livreur">
                  {d.agent ? `${d.agent.name}${d.agent.phone ? ` · ${d.agent.phone}` : ''}` : '—'}
                </Row>
                <Row label="Départ">{d.pickupAddress}</Row>
                <Row label="Arrivée">{d.adresseLivraison}</Row>
                <Row label="Colis">{d.packageDescription || '—'}</Row>
                {d.notes && <Row label="Notes">{d.notes}</Row>}
                <Row label="Délai">{DELAI_LABEL[d.delai] ?? d.delai}</Row>
                <Row label="Prix proposé">{d.proposedPrice != null ? formatFCFA(d.proposedPrice) : '—'}</Row>
                {d.counterPrice != null && <Row label="Contre-offre">{formatFCFA(d.counterPrice)}</Row>}
                <Row label="Prix convenu">
                  <span className="font-semibold">{d.price != null ? formatFCFA(d.price) : '—'}</span>
                </Row>
                <Row label="Paiement">
                  {(d.paymentStatus && PAYMENT_LABEL[d.paymentStatus]) || d.paymentStatus || '—'}
                  {d.paymentOperator ? ` · ${d.paymentOperator}` : ''}
                </Row>
                {d.paymentRef && (
                  <Row label="Réf. FeexPay">
                    <span className="font-mono text-[12px]">{d.paymentRef}</span>
                  </Row>
                )}
                {d.paidAt && (
                  <Row label="Payée le">
                    <LocalDate iso={d.paidAt} />
                  </Row>
                )}
                {d.refundStatus && (
                  <Row label="Remboursement">
                    {d.refundStatus}
                    {d.refundedAt && (
                      <>
                        {' · '}
                        <LocalDate iso={d.refundedAt} />
                      </>
                    )}
                  </Row>
                )}
                <Row label="Créée le">
                  <LocalDate iso={d.createdAt} />
                </Row>
              </dl>

              {d.earning && (
                <div className="rounded-md border border-border p-3">
                  <p className="font-medium mb-1">Gain du livreur</p>
                  <p className="text-muted-foreground">
                    {formatFCFA(d.earning.montantLivreur)} pour le livreur ({d.earning.taux} %) ·{' '}
                    {formatFCFA(d.earning.montantPlateforme)} pour la plateforme · {d.earning.status === 'payé' ? 'déjà versé' : 'à verser'}
                  </p>
                </div>
              )}

              {d.adminNote && (
                <div>
                  <p className="text-muted-foreground mb-1">Notes internes</p>
                  <p className="whitespace-pre-wrap break-words rounded-md bg-muted/30 p-2.5 text-[12px]">
                    {d.adminNote}
                  </p>
                </div>
              )}

              {mode ? (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="font-medium">{MODE_TEXT[mode].title}</p>
                  <p className="text-[12px] text-muted-foreground">{MODE_TEXT[mode].help}</p>
                  <Label htmlFor="express-note" className="text-[13px]">
                    {MODE_TEXT[mode].needsText ? (
                      <>
                        Motif <span className="text-destructive">*</span>
                      </>
                    ) : (
                      'Note (facultatif)'
                    )}
                  </Label>
                  <Textarea
                    id="express-note"
                    value={text}
                    maxLength={mode === 'cancel' ? 300 : 500}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[70px] text-[13px] resize-none"
                    disabled={isPending}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={isPending} onClick={() => choose(null)}>
                      Retour
                    </Button>
                    <Button
                      size="sm"
                      variant={MODE_TEXT[mode].danger ? 'destructive' : 'default'}
                      disabled={isPending || (MODE_TEXT[mode].needsText && text.trim().length < 3)}
                      onClick={submit}
                    >
                      {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                      {MODE_TEXT[mode].cta}
                    </Button>
                  </div>
                </div>
              ) : (
                (canResolve || canRefund || canCancel) && (
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    {canResolve && (
                      <>
                        <Button size="sm" onClick={() => choose('paid')}>
                          Paiement reçu
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => choose('failed')}>
                          Paiement non reçu
                        </Button>
                      </>
                    )}
                    {canRefund && (
                      <Button size="sm" onClick={() => choose('refunded')}>
                        Marquer remboursé
                      </Button>
                    )}
                    {canCancel && (
                      <Button size="sm" variant="destructive" onClick={() => choose('cancel')}>
                        Annuler la course
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
