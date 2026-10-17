'use client';

import { useRouter } from 'next/navigation';
import { BellRing, CheckCircle2, ChevronLeft, ChevronRight, Filter, Phone, RefreshCw, X } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { formatFCFA } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/status-meta';
import type {
  LateConfirmationLevel,
  LateConfirmationOrder,
  LateConfirmationResponse,
} from '@/lib/orders/types';

interface LateConfirmationClientProps {
  data: LateConfirmationResponse;
  currentPage: number;
  level: LateConfirmationLevel;
  vendorId: string | null;
}

/** Décimal Postgres (chaîne) → « 12 500 FCFA » ; valeur illisible → « — » (jamais « NaN »). */
function formatAmount(total: string | number | null | undefined): string {
  if (total == null || total === '' || !Number.isFinite(Number(total))) return '—';
  return formatFCFA(total);
}

/** 31.4 → « 31 h » ; au-delà de 48 h on ajoute les jours : « 52 h (2 j) ». */
function formatWait(hours: number): string {
  if (!Number.isFinite(hours)) return '—';
  const h = Math.floor(hours);
  return h >= 48 ? `${h} h (${Math.floor(h / 24)} j)` : `${h} h`;
}

function customerName(c: LateConfirmationOrder['customer'] | null | undefined): string {
  return `${c?.prenom ?? ''} ${c?.name ?? ''}`.trim() || '—';
}

const PHONE_RE = /^\+?[0-9\s().-]{6,20}$/;

function StageChips({ order }: { order: LateConfirmationOrder }) {
  const alerted = order.stage === 'alert' || !!order.adminAlertedAt;
  return (
    <span className="flex flex-wrap gap-1">
      {alerted && (
        <Badge variant="outline" className="gap-1 text-[10px] border-red-500/40 bg-red-500/5 text-red-600">
          <BellRing className="h-3 w-3" />
          Alerte admin
        </Badge>
      )}
      {order.vendorReminderSentAt ? (
        <Badge variant="outline" className="gap-1 text-[10px] border-amber-500/40 bg-amber-500/5 text-amber-600">
          <CheckCircle2 className="h-3 w-3" />
          Rappel envoyé
        </Badge>
      ) : (
        !alerted && (
          <Badge variant="outline" className="text-[10px] border-slate-400/40 bg-slate-500/5 text-slate-500">
            En attente de rappel
          </Badge>
        )
      )}
    </span>
  );
}

export function LateConfirmationClient({ data, currentPage, level, vendorId }: LateConfirmationClientProps) {
  const router = useRouter();
  const { reminderHours, adminAlertHours } = data.thresholds;

  const navigate = (mutate: (url: URL) => void) => {
    const url = new URL(window.location.href);
    mutate(url);
    router.push(url.pathname + url.search);
  };

  const setLevel = (l: LateConfirmationLevel) =>
    navigate((url) => {
      if (l === 'alert') url.searchParams.set('level', 'alert');
      else url.searchParams.delete('level');
      url.searchParams.delete('page');
    });

  const setVendor = (id: string | null) =>
    navigate((url) => {
      if (id) url.searchParams.set('vendorId', id);
      else url.searchParams.delete('vendorId');
      url.searchParams.delete('page');
    });

  const goToPage = (p: number) => navigate((url) => url.searchParams.set('page', String(p)));

  const levels: { value: LateConfirmationLevel; label: string }[] = [
    { value: 'reminder', label: `Rappel et plus (≥ ${reminderHours} h)` },
    { value: 'alert', label: `Alerte admin (≥ ${adminAlertHours} h)` },
  ];

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[13px] text-muted-foreground">
        Commandes payées que le vendeur n&apos;a pas encore confirmées. Rappel après {reminderHours} h, alerte après{' '}
        {adminAlertHours} h.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {levels.map((l) => (
          <Button
            key={l.value}
            size="sm"
            variant={level === l.value ? 'default' : 'outline'}
            className="h-8 text-[12px]"
            aria-pressed={level === l.value}
            onClick={() => setLevel(l.value)}
          >
            {l.label}
          </Button>
        ))}
        {vendorId && (
          <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-[12px]" onClick={() => setVendor(null)}>
            <Filter className="h-3 w-3" />
            Une seule boutique
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="ml-auto h-8 w-8"
          title="Actualiser"
          aria-label="Actualiser la liste"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucune commande en retard de confirmation</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-2.5 text-left font-medium text-muted-foreground">N° commande</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Boutique</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Client</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Montant</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Attente</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Suivi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.data.map((o) => (
                      <tr key={o.id} className="transition-colors hover:bg-muted/20">
                        <td className="px-6 py-3.5 align-top">
                          <span className="font-mono text-[12px] font-medium">{o.orderNumber}</span>
                          <p className="text-[11px] text-muted-foreground">
                            <LocalDate iso={o.createdAt} pattern="d MMM yyyy HH:mm" />
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <VendorCell order={o} onFilter={setVendor} active={!!vendorId} />
                        </td>
                        <td className="px-4 py-3.5 align-top text-muted-foreground">{customerName(o.customer)}</td>
                        <td className="px-4 py-3.5 align-top">
                          <span className="font-medium">{formatAmount(o.total)}</span>
                          {o.paymentMethod && (
                            <p className="text-[11px] text-muted-foreground">{paymentMethodLabel(o.paymentMethod)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <WaitCell order={o} />
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <StageChips order={o} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-border md:hidden">
                {data.data.map((o) => (
                  <div key={o.id} className="space-y-2 px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[13px] font-medium">{o.orderNumber}</span>
                      <WaitCell order={o} />
                    </div>
                    <VendorCell order={o} onFilter={setVendor} active={!!vendorId} />
                    <p className="text-[12px] text-muted-foreground">
                      {customerName(o.customer)} · <span className="font-medium text-foreground">{formatAmount(o.total)}</span>
                    </p>
                    <StageChips order={o} />
                  </div>
                ))}
              </div>
            </>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3.5">
              <p className="text-[12px] text-muted-foreground">
                {data.total} commande{data.total > 1 ? 's' : ''} · Page {currentPage} sur {data.pages}
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
        </CardContent>
      </Card>
    </div>
  );
}

function WaitCell({ order }: { order: LateConfirmationOrder }) {
  return (
    <span
      className={cn(
        'whitespace-nowrap text-[13px] font-semibold tabular-nums',
        order.stage === 'alert' ? 'text-red-600' : 'text-amber-600',
      )}
      title="Temps écoulé depuis le paiement"
    >
      {formatWait(order.hoursWaiting)}
    </span>
  );
}

function VendorCell({
  order,
  onFilter,
  active,
}: {
  order: LateConfirmationOrder;
  onFilter: (vendorId: string | null) => void;
  active: boolean;
}) {
  const phone = order.vendor.phone && PHONE_RE.test(order.vendor.phone) ? order.vendor.phone : null;
  return (
    <div className="min-w-0">
      {active ? (
        <p className="truncate font-medium">{order.vendor.shopName}</p>
      ) : (
        <button
          type="button"
          className="max-w-full truncate text-left font-medium hover:text-primary hover:underline"
          title="Voir seulement les commandes de cette boutique"
          onClick={() => onFilter(order.vendor.id)}
        >
          {order.vendor.shopName}
        </button>
      )}
      {phone ? (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Phone className="h-3 w-3" />
          {phone}
        </a>
      ) : (
        <p className="text-[11px] text-muted-foreground">Téléphone non renseigné</p>
      )}
    </div>
  );
}
