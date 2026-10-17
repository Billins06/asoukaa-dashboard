'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CircleCheck } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { formatFCFA } from '@/lib/format';
import { orderStatusMeta, paymentMethodLabel } from '@/lib/status-meta';
import type { PaymentToReviewItem, BackendPaginated } from '@/lib/payments/types';
import { MarkReviewedDialog } from './mark-reviewed-dialog';

interface PaymentsToReviewClientProps {
  data: BackendPaginated<PaymentToReviewItem>;
  currentPage: number;
}

/** Le serveur ne joint pas le nom du client : on montre le début de son identifiant. */
function customerRef(p: PaymentToReviewItem): string {
  const id = p.order?.userId;
  return id ? `Client n° ${id.slice(0, 8)}` : 'Client inconnu';
}

function OrderStatusBadge({ status }: { status: string }) {
  const meta = orderStatusMeta(status);
  return (
    <Badge variant="outline" className={cn('text-[11px]', meta.badge)}>
      {meta.label}
    </Badge>
  );
}

function method(p: PaymentToReviewItem): string {
  const label = paymentMethodLabel(p.method);
  return p.operator ? `${label} · ${p.operator}` : label;
}

export function PaymentsToReviewClient({ data, currentPage }: PaymentsToReviewClientProps) {
  const router = useRouter();

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(p));
    router.push(url.pathname + url.search);
  };

  return (
    <Card>
      <CardContent className="p-0">
        {data.data.length === 0 && data.total > 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <CircleCheck className="h-8 w-8 opacity-30" />
            <p className="text-sm">Page hors limites</p>
            <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => goToPage(1)}>
              Revenir à la page 1
            </Button>
          </div>
        ) : data.data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <CircleCheck className="h-8 w-8 opacity-30" />
            <p className="text-sm">Aucun paiement à examiner</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Commande</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Client</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Montant débité</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Référence opérateur</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Date</th>
                    <th className="text-right font-medium text-muted-foreground px-6 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-[12px] font-medium">
                          {p.order?.orderNumber ?? '—'}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          {p.order && <OrderStatusBadge status={p.order.status} />}
                          {p.order?.vendor?.shopName && (
                            <span className="text-[11px] text-muted-foreground">
                              {p.order.vendor.shopName}
                            </span>
                          )}
                        </div>
                        {p.order?.motifAnnulation && (
                          <p
                            className="mt-1 max-w-[260px] truncate text-[11px] text-muted-foreground"
                            title={p.order.motifAnnulation}
                          >
                            {p.order.motifAnnulation}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <span title={p.order?.userId ?? undefined}>{customerRef(p)}</span>
                      </td>
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                        {formatFCFA(p.montant)}
                        <p className="text-[11px] font-normal text-muted-foreground">{method(p)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[12px] break-all">{p.providerRef || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        <LocalDate iso={p.createdAt} pattern="d MMM yyyy HH:mm" />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <MarkReviewedDialog
                          id={p.id}
                          orderNumber={p.order?.orderNumber ?? '—'}
                          montant={p.montant}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-border">
              {data.data.map((p) => (
                <div key={p.id} className="px-4 py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[12px] font-medium">
                      {p.order?.orderNumber ?? '—'}
                    </span>
                    {p.order && <OrderStatusBadge status={p.order.status} />}
                  </div>
                  <p className="text-[12px] text-muted-foreground">{customerRef(p)}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium">{formatFCFA(p.montant)}</span>
                    <span className="text-[11px] text-muted-foreground">
                      <LocalDate iso={p.createdAt} pattern="d MMM yyyy HH:mm" />
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Réf. opérateur :{' '}
                    <span className="font-mono break-all">{p.providerRef || '—'}</span>
                  </p>
                  <div className="pt-1">
                    <MarkReviewedDialog
                      id={p.id}
                      orderNumber={p.order?.orderNumber ?? '—'}
                      montant={p.montant}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {data.total > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
            <p className="text-[12px] text-muted-foreground">
              {data.total} paiement{data.total > 1 ? 's' : ''} · Page {currentPage} sur {Math.max(1, data.pages)}
            </p>
            {data.pages > 1 && (
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
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
