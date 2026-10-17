'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Store,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { LocalDate } from '@/components/local-date';
import { ReviewDialog } from './review-dialog';
import { VendorCategories } from './vendor-categories';
import { blockVendorAction, unblockVendorAction } from '@/server/actions/vendors-actions';
import type { VendorListItem, VendorPendingItem, BackendPaginated, VendorStatus } from '@/lib/vendors/types';

interface VendorsClientProps {
  allData: BackendPaginated<VendorListItem>;
  pendingData: VendorPendingItem[];
  activeTab: string;
  currentPage: number;
}

const STATUS_LABELS: Record<VendorStatus, string> = {
  'en attente': 'En attente',
  'approuvé': 'Approuvé',
  'rejeté': 'Refusé',
  'bloqué': 'Bloqué',
};

const STATUS_COLORS: Record<VendorStatus, string> = {
  'en attente': 'border-amber-500/40 text-amber-600 bg-amber-500/5',
  'approuvé': 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5',
  'rejeté': 'border-destructive/40 text-destructive bg-destructive/5',
  'bloqué': 'border-slate-500/40 text-slate-600 bg-slate-500/5',
};

function VendorStatusBadge({ status }: { status: VendorStatus }) {
  return (
    <Badge variant="outline" className={`text-[11px] ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function BlockButton({ vendorId, shopName }: { vendorId: string; shopName?: string }) {
  const handleConfirm = async () => {
    try {
      const result = await blockVendorAction(vendorId);
      if (result.success) toast.success('Vendeur suspendu');
      else toast.error(result.error);
    } catch {
      toast.error('Le serveur ne répond pas. Réessayez dans un instant.');
    }
  };
  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
        >
          <ShieldOff className="h-3 w-3 mr-1" />
          Suspendre
        </Button>
      }
      title="Suspendre ce vendeur ?"
      description={`${shopName ? `La boutique « ${shopName} »` : 'Cette boutique'} ne sera plus visible ni accessible aux clients tant que le vendeur est suspendu. Vous pourrez le débloquer à tout moment.`}
      confirmLabel="Suspendre"
      tone="destructive"
      onConfirm={handleConfirm}
    />
  );
}

function UnblockButton({ vendorId }: { vendorId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await unblockVendorAction(vendorId);
          if (result.success) toast.success('Vendeur débloqué');
          else toast.error(result.error);
        });
      }}
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
      Débloquer
    </Button>
  );
}

export function VendorsClient({ allData, pendingData, activeTab, currentPage }: VendorsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const tab = activeTab === 'pending' ? 'pending' : 'all';

  const setTab = (t: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', t);
    url.searchParams.delete('page');
    router.push(url.pathname + url.search);
  };

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(Math.max(1, p)));
    router.push(url.pathname + url.search);
  };

  const filteredAll = useMemo(() => {
    if (!search.trim()) return allData.data;
    const q = search.toLowerCase();
    return allData.data.filter(
      (v) =>
        v.shopName.toLowerCase().includes(q) ||
        v.user.prenom.toLowerCase().includes(q) ||
        v.user.name.toLowerCase().includes(q) ||
        v.user.email.toLowerCase().includes(q),
    );
  }, [allData.data, search]);

  const filteredPending = useMemo(() => {
    if (!search.trim()) return pendingData;
    const q = search.toLowerCase();
    return pendingData.filter(
      (v) =>
        v.shopName.toLowerCase().includes(q) ||
        v.user.prenom.toLowerCase().includes(q) ||
        v.user.name.toLowerCase().includes(q) ||
        v.user.email.toLowerCase().includes(q),
    );
  }, [pendingData, search]);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={tab === 'all' ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setTab('all')}
        >
          <Store className="h-3.5 w-3.5" />
          Tous
          <span className="ml-0.5 text-[10px] opacity-70">({allData.total})</span>
        </Button>
        <Button
          variant={tab === 'pending' ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setTab('pending')}
        >
          <Clock className="h-3.5 w-3.5" />
          En attente
          {pendingData.length > 0 && (
            <span className="ml-0.5 rounded-full bg-amber-500/20 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 leading-none">
              {pendingData.length}
            </span>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Boutique, propriétaire, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {tab === 'all' ? (
            <>
              {filteredAll.length === 0 ? (
                <EmptyState label="Aucun vendeur trouvé" />
              ) : (
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Boutique</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Propriétaire</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Soumis</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredAll.map((vendor) => (
                        <tr key={vendor.id} className="group hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                <Store className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{vendor.shopName}</p>
                                <VendorCategories categories={vendor.categories} activityType={vendor.activityType} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-foreground">{vendor.user.prenom} {vendor.user.name}</p>
                            <p className="text-[11px] text-muted-foreground">{vendor.user.email}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <VendorStatusBadge status={vendor.status} />
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            <LocalDate iso={vendor.submittedAt} pattern="d MMM yyyy" />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {vendor.status === 'en attente' && (
                                <>
                                  <ReviewDialog vendor={vendor} action="approve">
                                    <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Valider
                                    </Button>
                                  </ReviewDialog>
                                  <ReviewDialog vendor={vendor} action="reject">
                                    <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/5">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Refuser
                                    </Button>
                                  </ReviewDialog>
                                </>
                              )}
                              {vendor.status === 'approuvé' && (
                                <BlockButton vendorId={vendor.id} shopName={vendor.shopName} />
                              )}
                              {vendor.status === 'bloqué' && (
                                <UnblockButton vendorId={vendor.id} />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile cards - all */}
              <div className="sm:hidden divide-y divide-border">
                {filteredAll.map((vendor) => (
                  <VendorMobileCard key={vendor.id} vendor={vendor} />
                ))}
              </div>

              {allData.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
                  <p className="text-[12px] text-muted-foreground">
                    Page {currentPage} sur {allData.pages}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= allData.pages}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {filteredPending.length === 0 ? (
                <EmptyState label="Aucune candidature en attente" icon={<Clock className="h-8 w-8 opacity-30" />} />
              ) : (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Boutique</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Candidat</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Soumis le</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Tentative</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredPending.map((vendor) => (
                          <tr key={vendor.id} className="group hover:bg-amber-500/5 transition-colors">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                                <div>
                                  <p className="font-medium text-foreground">{vendor.shopName}</p>
                                  <VendorCategories categories={vendor.categories} activityType={vendor.activityType} />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <p>{vendor.user.prenom} {vendor.user.name}</p>
                              <p className="text-[11px] text-muted-foreground">{vendor.user.email}</p>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">
                              <LocalDate iso={vendor.submittedAt} pattern="d MMM yyyy" />
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-[11px] text-muted-foreground">
                                #{vendor.submissionCount}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <ReviewDialog vendor={vendor} action="approve">
                                  <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Valider
                                  </Button>
                                </ReviewDialog>
                                <ReviewDialog vendor={vendor} action="reject">
                                  <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/5">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Refuser
                                  </Button>
                                </ReviewDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile pending */}
                  <div className="sm:hidden divide-y divide-border">
                    {filteredPending.map((vendor) => (
                      <div key={vendor.id} className="px-4 py-3.5 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <p className="text-[13px] font-medium">{vendor.shopName}</p>
                        </div>
                        <p className="text-[12px] text-muted-foreground pl-4">
                          {vendor.user.prenom} {vendor.user.name} — {vendor.user.email}
                        </p>
                        <div className="flex gap-2 pl-4">
                          <ReviewDialog vendor={vendor} action="approve">
                            <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valider
                            </Button>
                          </ReviewDialog>
                          <ReviewDialog vendor={vendor} action="reject">
                            <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40">
                              <XCircle className="h-3 w-3 mr-1" />
                              Refuser
                            </Button>
                          </ReviewDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VendorMobileCard({ vendor }: { vendor: VendorListItem }) {
  return (
    <div className="px-4 py-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium">{vendor.shopName}</p>
        <VendorStatusBadge status={vendor.status} />
      </div>
      <p className="text-[12px] text-muted-foreground">
        {vendor.user.prenom} {vendor.user.name} — {vendor.user.email}
      </p>
      {vendor.status === 'en attente' && (
        <div className="flex gap-2">
          <ReviewDialog vendor={vendor} action="approve">
            <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Valider
            </Button>
          </ReviewDialog>
          <ReviewDialog vendor={vendor} action="reject">
            <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40">
              <XCircle className="h-3 w-3 mr-1" />
              Refuser
            </Button>
          </ReviewDialog>
        </div>
      )}
      {vendor.status === 'approuvé' && (
        <div className="flex gap-2">
          <BlockButton vendorId={vendor.id} shopName={vendor.shopName} />
        </div>
      )}
      {vendor.status === 'bloqué' && (
        <div className="flex gap-2">
          <UnblockButton vendorId={vendor.id} />
        </div>
      )}
    </div>
  );
}

function EmptyState({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
      {icon ?? <Store className="h-8 w-8 opacity-30" />}
      <p className="text-sm">{label}</p>
    </div>
  );
}
