'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LocalDate } from '@/components/local-date';
import { getDigitalRefundPreviewAction, refundDigitalOrderAction } from '@/server/actions/support-actions';
import type { DigitalRefundPreview } from '@/lib/support/types';

interface DigitalRefundPanelProps {
  ticketId: string;
  orderId: string;
  orderNumber: string;
}

const fmtMoney = (n: number) => `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} F`;

/**
 * Remboursement d'un livre numérique depuis un ticket. Règle métier : seulement si le fichier
 * est défectueux ou n'a jamais été téléchargé, et si le client a signalé le problème dans les 24 h.
 */
export function DigitalRefundPanel({ ticketId, orderId, orderNumber }: DigitalRefundPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<DigitalRefundPreview | null>(null);
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState('');

  const loadPreview = () =>
    startTransition(async () => {
      const r = await getDigitalRefundPreviewAction(orderId, ticketId);
      if (r.success) {
        setPreview(r.data);
        setMotif('');
        setOpen(true);
      } else {
        toast.error(r.error);
      }
    });

  const confirm = () =>
    startTransition(async () => {
      const r = await refundDigitalOrderAction(orderId, ticketId, motif);
      if (r.success) {
        toast.success('Remboursement approuvé : le client n\'a plus accès au livre.');
        setOpen(false);
        setPreview(null);
      } else {
        toast.error(r.error);
      }
    });

  const downloaded = preview ? preview.livres.some((b) => b.downloadCount > 0) : false;
  const canRefund =
    !!preview &&
    !preview.dejaRembourse &&
    preview.fenetreOuverte &&
    preview.montantRemboursable > 0 &&
    preview.paymentStatus === 'success';

  return (
    <>
      <Card className="border-indigo-500/30 bg-indigo-500/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-[13px]">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div>
              <p className="font-medium">La commande liée (N° {orderNumber}) est un livre numérique</p>
              <p className="text-[12px] text-muted-foreground">
                Remboursement possible uniquement si le fichier est défectueux ou n&apos;a jamais été téléchargé,
                et signalé dans les 24 h après l&apos;achat.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={isPending} onClick={loadPreview}>
            {isPending && !open ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Vérifier / rembourser le livre
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rembourser le livre numérique</DialogTitle>
            <DialogDescription>Commande N° {orderNumber}</DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-3 text-[13px]">
              <div className="space-y-1.5 rounded-md border border-border p-3">
                {preview.livres.length === 0 && <p className="text-muted-foreground">Aucun livre trouvé.</p>}
                {preview.livres.map((b) => (
                  <div key={b.productId} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{b.title}</span>
                    {b.downloadCount > 0 ? (
                      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-700">
                        Téléchargé {b.downloadCount} fois
                        {b.firstDownloadedAt && (
                          <>
                            {' '}· 1re fois <LocalDate iso={b.firstDownloadedAt} />
                          </>
                        )}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[11px] text-emerald-700">
                        Jamais téléchargé
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              <ul className="space-y-1 text-[12px]">
                <li>
                  Montant remboursé au client : <strong>{fmtMoney(preview.montantRemboursable)}</strong> (payé :{' '}
                  {fmtMoney(preview.totalPaye)})
                </li>
                <li>
                  Délai de 24 h :{' '}
                  <strong className={preview.fenetreOuverte ? 'text-emerald-600' : 'text-destructive'}>
                    {preview.fenetreOuverte ? 'respecté' : 'dépassé'}
                  </strong>{' '}
                  — {preview.fenetreMotif}
                </li>
                {preview.dejaRembourse && <li className="text-destructive">Déjà remboursé.</li>}
              </ul>

              {downloaded && (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[12px] text-amber-800">
                  Ce livre a déjà été téléchargé : à n&apos;accepter que si le fichier est réellement défectueux
                  (vérifiez les messages du client).
                </p>
              )}

              <div className="space-y-1.5">
                <Label className="text-[13px]">Motif du remboursement</Label>
                <Textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  maxLength={480}
                  rows={3}
                  placeholder="Ex : fichier PDF illisible, constaté par l'équipe"
                  disabled={isPending}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button onClick={confirm} disabled={isPending || !canRefund || !motif.trim()}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Rembourser et retirer le livre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
