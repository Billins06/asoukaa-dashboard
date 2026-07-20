'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, PowerOff, Power, Loader2, Handshake, ExternalLink } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PartnerFormDialog } from './partner-form-dialog';
import { togglePartnerAction, deletePartnerAction } from '@/server/actions/partners-actions';
import type { PartnerListItem, BackendPaginated } from '@/lib/partners/types';

interface PartnersClientProps {
  data: BackendPaginated<PartnerListItem>;
  currentPage: number;
}

function RowActions({ partner }: { partner: PartnerListItem }) {
  const [isPendingToggle, startToggle] = useTransition();
  const [isPendingDelete, startDelete] = useTransition();

  return (
    <div className="flex items-center gap-0.5 justify-end">
      <PartnerFormDialog mode="edit" partner={partner}>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Modifier">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </PartnerFormDialog>
      <Button
        size="sm" variant="ghost"
        className={`h-7 w-7 p-0 ${partner.isActive ? 'text-muted-foreground hover:text-amber-600' : 'text-muted-foreground hover:text-emerald-600'}`}
        disabled={isPendingToggle}
        title={partner.isActive ? 'Désactiver' : 'Activer'}
        onClick={() => startToggle(async () => {
          const r = await togglePartnerAction(partner.id);
          if (!r.success) toast.error(r.error);
          else toast.success(partner.isActive ? 'Désactivé' : 'Activé');
        })}
      >
        {isPendingToggle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : partner.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
      </Button>
      <Button
        size="sm" variant="ghost"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        disabled={isPendingDelete}
        title="Supprimer"
        onClick={() => {
          if (!confirm(`Supprimer "${partner.part_name}" ?`)) return;
          startDelete(async () => {
            const r = await deletePartnerAction(partner.id);
            if (!r.success) toast.error(r.error);
            else toast.success('Partenaire supprimé');
          });
        }}
      >
        {isPendingDelete ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export function PartnersClient({ data, currentPage }: PartnersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data.data;
    const q = search.toLowerCase();
    return data.data.filter((p) => p.part_name.toLowerCase().includes(q));
  }, [data.data, search]);

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(p));
    router.push(url.pathname + url.search);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">
          {data.total} partenaire{data.total > 1 ? 's' : ''}
        </p>
        <PartnerFormDialog mode="create" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Chercher un partenaire..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-[13px]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Handshake className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucun partenaire</p>
              <PartnerFormDialog mode="create" />
            </div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Nom</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden md:table-cell">Description</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Site web</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {p.part_logoUrl ? (
                              <img src={p.part_logoUrl} alt={p.part_name} className="h-6 w-6 rounded object-contain bg-muted" />
                            ) : (
                              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                                <Handshake className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{p.part_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground max-w-[200px] hidden md:table-cell">
                          <p className="truncate">{p.description ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          {p.part_websiteUrl ? (
                            <a href={p.part_websiteUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-[12px]">
                              <ExternalLink className="h-3 w-3" />
                              Site
                            </a>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className={`text-[11px] ${p.isActive ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5' : 'border-slate-500/40 text-slate-500 bg-slate-500/5'}`}>
                            {p.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5"><RowActions partner={p} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden divide-y divide-border">
                {filtered.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                      {p.part_logoUrl
                        ? <img src={p.part_logoUrl} alt={p.part_name} className="h-8 w-8 rounded object-contain" />
                        : <Handshake className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">{p.part_name}</p>
                      <Badge variant="outline" className={`text-[11px] mt-0.5 ${p.isActive ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5' : 'border-slate-500/40 text-slate-500 bg-slate-500/5'}`}>
                        {p.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <RowActions partner={p} />
                  </div>
                ))}
              </div>
            </>
          )}
          {data.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">Page {currentPage} sur {data.pages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= data.pages}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
