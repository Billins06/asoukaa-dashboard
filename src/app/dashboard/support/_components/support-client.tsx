'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LifeBuoy, Paperclip, RefreshCw, Search, X } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { personName, TICKET_STATUS_META } from '@/lib/support/meta';
import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  type TicketListItem,
  type TicketListResponse,
  type TicketStats,
} from '@/lib/support/types';
import { TicketStatusBadge } from './ticket-status-badge';

interface SupportClientProps {
  data: TicketListResponse;
  stats: TicketStats | null;
  currentPage: number;
  filters: { status: string; category: string; search: string };
}

function UnreadDot() {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#FF6210]"
      title="Nouveau message non lu"
      role="img"
      aria-label="Non lu"
    />
  );
}

function LastMessage({ ticket }: { ticket: TicketListItem }) {
  const m = ticket.lastMessage;
  if (!m) return null;
  return (
    <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
      {m.attachmentCount > 0 && <Paperclip className="h-3 w-3 shrink-0" aria-label="Pièce jointe" />}
      <span className="truncate">
        {m.authorType === 'admin' ? 'Équipe : ' : ''}
        {m.preview}
      </span>
    </p>
  );
}

export function SupportClient({ data, stats, currentPage, filters }: SupportClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.search);

  const navigate = (mutate: (url: URL) => void) => {
    const url = new URL(window.location.href);
    mutate(url);
    router.push(url.pathname + url.search);
  };

  const setFilter = (key: 'status' | 'category', value: string) =>
    navigate((url) => {
      if (value === 'all') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
      url.searchParams.delete('page');
    });

  const applySearch = (value: string) =>
    navigate((url) => {
      const v = value.trim();
      if (v) url.searchParams.set('search', v);
      else url.searchParams.delete('search');
      url.searchParams.delete('page');
    });

  const goToPage = (p: number) => navigate((url) => url.searchParams.set('page', String(p)));

  const cards: { key: string; label: string; count: number | null; dot?: string }[] = [
    { key: 'all', label: 'Tous', count: stats?.total ?? null },
    ...TICKET_STATUSES.map((s) => ({
      key: s,
      label: TICKET_STATUS_META[s].label,
      count: stats ? stats[s] : null,
      dot: TICKET_STATUS_META[s].dot,
    })),
  ];

  const hasFilters = filters.status !== 'all' || filters.category !== 'all' || filters.search !== '';

  return (
    <div className="space-y-4">
      {/* Cartes de statistiques = filtre par statut */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => {
          const active = filters.status === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter('status', c.key)}
              aria-pressed={active}
              className={cn(
                'rounded-xl bg-card px-4 py-3 text-left ring-1 transition-all hover:bg-muted/30',
                active ? 'ring-2 ring-primary' : 'ring-foreground/10',
              )}
            >
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                {c.dot && <span className={cn('h-2 w-2 rounded-full', c.dot)} />}
                {c.label}
              </span>
              <span className="mt-1 block text-2xl font-bold tabular-nums">{c.count ?? '—'}</span>
              {c.key === 'all' && stats && stats.adminUnread > 0 && (
                <span className="text-[11px] font-medium text-[#FF6210]">
                  {stats.adminUnread} non lu{stats.adminUnread > 1 ? 's' : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <form
              className="relative w-full lg:w-80"
              onSubmit={(e) => {
                e.preventDefault();
                applySearch(search);
              }}
              role="search"
            >
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="N° (TCK-000042), sujet, e-mail…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={100}
                className="h-9 pl-8 pr-8 text-[13px]"
                aria-label="Rechercher un ticket"
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Effacer la recherche"
                  onClick={() => {
                    setSearch('');
                    if (filters.search) applySearch('');
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={filters.status} onValueChange={(v) => setFilter('status', v)}>
                <SelectTrigger className="h-9 w-40 text-[13px]" aria-label="Filtrer par statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {TICKET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TICKET_STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.category} onValueChange={(v) => setFilter('category', v)}>
                <SelectTrigger className="h-9 w-48 text-[13px]" aria-label="Filtrer par catégorie">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {TICKET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-[12px] text-muted-foreground"
                  onClick={() => {
                    setSearch('');
                    router.push('/dashboard/support');
                  }}
                >
                  Réinitialiser
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 lg:ml-auto"
                title="Actualiser"
                aria-label="Actualiser la liste"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <LifeBuoy className="h-8 w-8 opacity-30" />
              <p className="text-sm">{hasFilters ? 'Aucun ticket ne correspond aux filtres' : 'Aucun ticket pour le moment'}</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-2.5 text-left font-medium text-muted-foreground">Réf.</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Sujet</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Utilisateur</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Statut</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Assigné à</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Dernière activité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.data.map((t) => {
                      const href = `/dashboard/support/${t.id}`;
                      return (
                        <tr
                          key={t.id}
                          className="cursor-pointer transition-colors hover:bg-muted/20"
                          onClick={() => router.push(href)}
                        >
                          <td className="px-6 py-3.5 align-top">
                            <span className="flex items-center gap-2">
                              {t.adminHasUnread ? <UnreadDot /> : <span className="h-2 w-2" />}
                              <span className="font-mono text-[12px] font-medium">{t.reference}</span>
                            </span>
                          </td>
                          <td className="max-w-xs px-4 py-3.5 align-top">
                            <Link
                              href={href}
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                'block truncate hover:underline',
                                t.adminHasUnread ? 'font-semibold' : 'font-medium',
                              )}
                              title={t.subject}
                            >
                              {t.subject}
                            </Link>
                            <p className="text-[11px] text-muted-foreground">{t.category}</p>
                            <LastMessage ticket={t} />
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <p className="font-medium">{personName(t.user)}</p>
                            <p className="max-w-[14rem] truncate text-[11px] text-muted-foreground" title={t.user.email ?? ''}>
                              {t.user.email}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <TicketStatusBadge status={t.status} />
                          </td>
                          <td className="px-4 py-3.5 align-top text-muted-foreground">
                            {t.assignedAdmin ? (t.assignedAdmin.name ?? 'Un administrateur') : '—'}
                          </td>
                          <td className="px-4 py-3.5 align-top text-muted-foreground">
                            <LocalDate iso={t.lastMessageAt} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-border md:hidden">
                {data.data.map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/support/${t.id}`}
                    className="flex flex-col gap-1.5 px-4 py-3.5 transition-colors hover:bg-muted/20"
                  >
                    <span className="flex items-center gap-2">
                      {t.adminHasUnread && <UnreadDot />}
                      <span className="font-mono text-[12px] font-medium">{t.reference}</span>
                      <TicketStatusBadge status={t.status} />
                      <LocalDate iso={t.lastMessageAt} pattern="d MMM HH:mm" className="ml-auto text-[11px] text-muted-foreground" />
                    </span>
                    <span className={cn('truncate text-[13px]', t.adminHasUnread ? 'font-semibold' : 'font-medium')}>
                      {t.subject}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {personName(t.user)} · {t.category}
                    </span>
                    <LastMessage ticket={t} />
                  </Link>
                ))}
              </div>
            </>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3.5">
              <p className="text-[12px] text-muted-foreground">
                {data.total} ticket{data.total > 1 ? 's' : ''} · Page {currentPage} sur {data.pages}
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
