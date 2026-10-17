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
  Truck,
  Loader2,
  Star,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { toNumber } from '@/lib/format';
import { AGENT_STATUS, agentStatusMeta, vehicleLabel } from '@/lib/status-meta';
import { ReviewAgentDialog } from './review-agent-dialog';
import { blockAgentAction, unblockAgentAction } from '@/server/actions/agents-actions';
import type { AgentListItem, AgentPendingItem, BackendPaginated } from '@/lib/agents/types';

interface AgentsClientProps {
  allData: BackendPaginated<AgentListItem>;
  pendingData: AgentPendingItem[];
  activeTab: string;
  currentPage: number;
}

type ReviewTarget = Pick<AgentListItem, 'id' | 'user' | 'vehicleType' | 'ville'>;

function AgentStatusBadge({ status }: { status: string }) {
  const meta = agentStatusMeta(status);
  return (
    <Badge variant="outline" className={cn('text-[11px]', meta.badge)}>
      {meta.label}
    </Badge>
  );
}

function fullName(user: { prenom?: string | null; name?: string | null } | null | undefined): string {
  return `${user?.prenom ?? ''} ${user?.name ?? ''}`.trim() || 'Livreur sans nom';
}

function getInitials(user: { prenom?: string | null; name?: string | null } | null | undefined) {
  return `${(user?.prenom ?? '')[0] ?? ''}${(user?.name ?? '')[0] ?? ''}`.toUpperCase() || '?';
}

/** Bloquer un livreur le retire des livraisons et lui envoie un e-mail : confirmation obligatoire. */
function AgentBlockButton({ agent }: { agent: ReviewTarget }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await blockAgentAction(agent.id);
      if (result.success) {
        toast.success('Livreur bloqué');
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isPending) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
        >
          <ShieldOff className="h-3 w-3 mr-1" />
          Bloquer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-destructive" />
            Bloquer ce livreur ?
          </DialogTitle>
          <DialogDescription>
            {fullName(agent.user)} ({vehicleLabel(agent.vehicleType)} — {agent.ville})
          </DialogDescription>
        </DialogHeader>
        <p className="text-[13px] text-muted-foreground">
          Le livreur ne pourra plus recevoir de livraisons et sera prévenu par e-mail.
          Vous pourrez le débloquer ensuite depuis cette page.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Bloquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgentUnblockButton({ agentId }: { agentId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await unblockAgentAction(agentId);
          if (result.success) toast.success('Livreur débloqué');
          else toast.error(result.error);
        });
      }}
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
      Débloquer
    </Button>
  );
}

/** Valider / Refuser une candidature « en attente ». */
function ReviewButtons({ agent }: { agent: ReviewTarget }) {
  const target = { id: agent.id, user: agent.user, vehicleType: agent.vehicleType, ville: agent.ville };
  return (
    <>
      <ReviewAgentDialog agent={target} action="approve">
        <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Valider
        </Button>
      </ReviewAgentDialog>
      <ReviewAgentDialog agent={target} action="reject">
        <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/5">
          <XCircle className="h-3 w-3 mr-1" />
          Refuser
        </Button>
      </ReviewAgentDialog>
    </>
  );
}

/** Boutons selon le statut serveur : en attente → Valider/Refuser · approuvé → Bloquer · bloqué → Débloquer. */
function AgentActions({ agent }: { agent: AgentListItem }) {
  return (
    <>
      {agent.status === AGENT_STATUS.PENDING && <ReviewButtons agent={agent} />}
      {agent.status === AGENT_STATUS.APPROVED && <AgentBlockButton agent={agent} />}
      {agent.status === AGENT_STATUS.BLOCKED && <AgentUnblockButton agentId={agent.id} />}
    </>
  );
}

function Rating({ agent }: { agent: AgentListItem }) {
  if (!(agent.totalLivraisons > 0)) return <span className="text-muted-foreground">—</span>;
  // noteMoyenne et tauxDeReussite arrivent en TEXTE : conversion obligatoire avant toFixed.
  const note = toNumber(agent.noteMoyenne);
  return (
    <span className="flex items-center gap-1 text-amber-500 font-medium">
      <Star className="h-3 w-3 fill-amber-500" />
      {note.toFixed(1)}
    </span>
  );
}

function Performance({ agent }: { agent: AgentListItem }) {
  const livraisons = toNumber(agent.totalLivraisons);
  if (livraisons <= 0) return <span className="text-muted-foreground">—</span>;
  const taux = toNumber(agent.tauxDeReussite);
  return (
    <span className="text-muted-foreground">
      {livraisons} livraison{livraisons > 1 ? 's' : ''} · {taux.toFixed(0)} % réussies
    </span>
  );
}

export function AgentsClient({ allData, pendingData, activeTab, currentPage }: AgentsClientProps) {
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
    url.searchParams.set('page', String(p));
    router.push(url.pathname + url.search);
  };

  const filteredAll = useMemo(() => {
    if (!search.trim()) return allData.data;
    const q = search.toLowerCase();
    return allData.data.filter(
      (a) =>
        (a.user?.prenom ?? '').toLowerCase().includes(q) ||
        (a.user?.name ?? '').toLowerCase().includes(q) ||
        (a.user?.email ?? '').toLowerCase().includes(q) ||
        (a.ville ?? '').toLowerCase().includes(q),
    );
  }, [allData.data, search]);

  const filteredPending = useMemo(() => {
    if (!search.trim()) return pendingData;
    const q = search.toLowerCase();
    return pendingData.filter(
      (a) =>
        (a.user?.prenom ?? '').toLowerCase().includes(q) ||
        (a.user?.name ?? '').toLowerCase().includes(q) ||
        (a.user?.email ?? '').toLowerCase().includes(q) ||
        (a.ville ?? '').toLowerCase().includes(q),
    );
  }, [pendingData, search]);

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="flex items-center gap-2">
        <Button
          variant={tab === 'all' ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
          aria-pressed={tab === 'all'}
          onClick={() => setTab('all')}
        >
          <Truck className="h-3.5 w-3.5" />
          Tous
          <span className="ml-0.5 text-[10px] opacity-70">({allData.total})</span>
        </Button>
        <Button
          variant={tab === 'pending' ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
          aria-pressed={tab === 'pending'}
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
              placeholder="Nom, email, ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
          {search.trim() && tab === 'all' && allData.pages > 1 && (
            <p className="text-[11px] text-muted-foreground">La recherche porte uniquement sur les livreurs de cette page.</p>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {tab === 'all' ? (
            <>
              {filteredAll.length === 0 ? (
                <EmptyState label="Aucun livreur trouvé" />
              ) : (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Livreur</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Ville</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Véhicule</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Note</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Livraisons</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredAll.map((agent) => (
                          <tr key={agent.id} className="group hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {getInitials(agent.user)}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{fullName(agent.user)}</p>
                                  <p className="text-[11px] text-muted-foreground">{agent.user?.email ?? '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">{agent.ville || '—'}</td>
                            <td className="px-4 py-3.5 text-muted-foreground">{vehicleLabel(agent.vehicleType)}</td>
                            <td className="px-4 py-3.5"><Rating agent={agent} /></td>
                            <td className="px-4 py-3.5 text-[12px]"><Performance agent={agent} /></td>
                            <td className="px-4 py-3.5">
                              <AgentStatusBadge status={agent.status} />
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <AgentActions agent={agent} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-border">
                    {filteredAll.map((agent) => (
                      <div key={agent.id} className="flex items-start gap-3 px-4 py-3.5">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                          {getInitials(agent.user)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{fullName(agent.user)}</p>
                          <p className="text-[11px] text-muted-foreground">{agent.ville || '—'} · {vehicleLabel(agent.vehicleType)}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <AgentStatusBadge status={agent.status} />
                            <AgentActions agent={agent} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {allData.total > 0 && (
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
                  <p className="text-[12px] text-muted-foreground">
                    {allData.total} livreur{allData.total > 1 ? 's' : ''} · Page {currentPage} sur {Math.max(1, allData.pages)}
                  </p>
                  {allData.pages > 1 && (
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Page précédente" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Page suivante" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= allData.pages}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
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
                          <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Livreur</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Ville</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Véhicule</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Soumis le</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredPending.map((agent) => (
                          <tr key={agent.id} className="group hover:bg-amber-500/5 transition-colors">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                                <div>
                                  <p className="font-medium text-foreground">{fullName(agent.user)}</p>
                                  <p className="text-[11px] text-muted-foreground">{agent.user?.email ?? '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">{agent.ville || '—'}</td>
                            <td className="px-4 py-3.5 text-muted-foreground">{vehicleLabel(agent.vehicleType)}</td>
                            <td className="px-4 py-3.5 text-muted-foreground">
                              <LocalDate iso={agent.createdAt} pattern="d MMM yyyy" />
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <ReviewButtons agent={agent} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile : en attente */}
                  <div className="sm:hidden divide-y divide-border">
                    {filteredPending.map((agent) => (
                      <div key={agent.id} className="px-4 py-3.5 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <p className="text-[13px] font-medium">{fullName(agent.user)}</p>
                        </div>
                        <p className="text-[12px] text-muted-foreground pl-4">
                          {agent.ville || '—'} · {vehicleLabel(agent.vehicleType)}
                        </p>
                        <div className="flex gap-2 pl-4">
                          <ReviewButtons agent={agent} />
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

function EmptyState({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
      {icon ?? <Truck className="h-8 w-8 opacity-30" />}
      <p className="text-sm">{label}</p>
    </div>
  );
}
