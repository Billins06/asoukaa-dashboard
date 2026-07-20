'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
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
import { ReviewAgentDialog } from './review-agent-dialog';
import { blockAgentAction } from '@/server/actions/agents-actions';
import type { AgentListItem, AgentPendingItem, AgentStatus, BackendPaginated } from '@/lib/agents/types';

interface AgentsClientProps {
  allData: BackendPaginated<AgentListItem>;
  pendingData: AgentPendingItem[];
  activeTab: string;
  currentPage: number;
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  PENDING: 'border-amber-500/40 text-amber-600 bg-amber-500/5',
  APPROVED: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5',
  REJECTED: 'border-destructive/40 text-destructive bg-destructive/5',
  BLOCKED: 'border-slate-500/40 text-slate-600 bg-slate-500/5',
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  BLOCKED: 'Bloqué',
};

const VEHICLE_LABELS: Record<string, string> = {
  MOTO: 'Moto',
  VOITURE: 'Voiture',
  TRICYCLE: 'Tricycle',
  VELO: 'Vélo',
};

function AgentStatusBadge({ status }: { status: AgentStatus }) {
  return (
    <Badge variant="outline" className={`text-[11px] ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function AgentBlockButton({ agentId }: { agentId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await blockAgentAction(agentId);
          if (result.success) toast.success('Livreur suspendu');
          else toast.error(result.error);
        });
      }}
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldOff className="h-3 w-3 mr-1" />}
      Suspendre
    </Button>
  );
}

function getInitials(prenom: string, name: string) {
  return `${prenom[0] ?? ''}${name[0] ?? ''}`.toUpperCase();
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
        a.user.prenom.toLowerCase().includes(q) ||
        a.user.name.toLowerCase().includes(q) ||
        a.user.email.toLowerCase().includes(q) ||
        a.ville.toLowerCase().includes(q),
    );
  }, [allData.data, search]);

  const filteredPending = useMemo(() => {
    if (!search.trim()) return pendingData;
    const q = search.toLowerCase();
    return pendingData.filter(
      (a) =>
        a.user.prenom.toLowerCase().includes(q) ||
        a.user.name.toLowerCase().includes(q) ||
        a.ville.toLowerCase().includes(q),
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
          <Truck className="h-3.5 w-3.5" />
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
              placeholder="Nom, email, ville..."
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
                <EmptyState label="Aucun livreur trouvé" />
              ) : (
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Livreur</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Ville</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Véhicule</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Note</th>
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
                                {getInitials(agent.user.prenom, agent.user.name)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {agent.user.prenom} {agent.user.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{agent.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">{agent.ville}</td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            {VEHICLE_LABELS[agent.vehicleType] ?? agent.vehicleType}
                          </td>
                          <td className="px-4 py-3.5">
                            {agent.totalLivraisons > 0 ? (
                              <span className="flex items-center gap-1 text-amber-500 font-medium">
                                <Star className="h-3 w-3 fill-amber-500" />
                                {agent.noteMoyenne.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <AgentStatusBadge status={agent.status} />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {agent.status === 'PENDING' && (
                                <>
                                  <ReviewAgentDialog agent={{ id: agent.id, user: agent.user, vehicleType: agent.vehicleType, ville: agent.ville }} action="approve">
                                    <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Valider
                                    </Button>
                                  </ReviewAgentDialog>
                                  <ReviewAgentDialog agent={{ id: agent.id, user: agent.user, vehicleType: agent.vehicleType, ville: agent.ville }} action="reject">
                                    <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/5">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Refuser
                                    </Button>
                                  </ReviewAgentDialog>
                                </>
                              )}
                              {agent.status === 'APPROVED' && (
                                <AgentBlockButton agentId={agent.id} />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-border">
                {filteredAll.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                      {getInitials(agent.user.prenom, agent.user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">
                        {agent.user.prenom} {agent.user.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{agent.ville} · {VEHICLE_LABELS[agent.vehicleType]}</p>
                      <div className="mt-1">
                        <AgentStatusBadge status={agent.status} />
                      </div>
                    </div>
                  </div>
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
                                  <p className="font-medium text-foreground">
                                    {agent.user.prenom} {agent.user.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">{agent.user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">{agent.ville}</td>
                            <td className="px-4 py-3.5 text-muted-foreground">
                              {VEHICLE_LABELS[agent.vehicleType] ?? agent.vehicleType}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">
                              {format(new Date(agent.createdAt), 'd MMM yyyy', { locale: fr })}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <ReviewAgentDialog agent={{ id: agent.id, user: agent.user, vehicleType: agent.vehicleType, ville: agent.ville }} action="approve">
                                  <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Valider
                                  </Button>
                                </ReviewAgentDialog>
                                <ReviewAgentDialog agent={{ id: agent.id, user: agent.user, vehicleType: agent.vehicleType, ville: agent.ville }} action="reject">
                                  <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/5">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Refuser
                                  </Button>
                                </ReviewAgentDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile pending */}
                  <div className="sm:hidden divide-y divide-border">
                    {filteredPending.map((agent) => (
                      <div key={agent.id} className="px-4 py-3.5 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <p className="text-[13px] font-medium">
                            {agent.user.prenom} {agent.user.name}
                          </p>
                        </div>
                        <p className="text-[12px] text-muted-foreground pl-4">
                          {agent.ville} · {VEHICLE_LABELS[agent.vehicleType]}
                        </p>
                        <div className="flex gap-2 pl-4">
                          <ReviewAgentDialog agent={{ id: agent.id, user: agent.user, vehicleType: agent.vehicleType, ville: agent.ville }} action="approve">
                            <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valider
                            </Button>
                          </ReviewAgentDialog>
                          <ReviewAgentDialog agent={{ id: agent.id, user: agent.user, vehicleType: agent.vehicleType, ville: agent.ville }} action="reject">
                            <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40">
                              <XCircle className="h-3 w-3 mr-1" />
                              Refuser
                            </Button>
                          </ReviewAgentDialog>
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
