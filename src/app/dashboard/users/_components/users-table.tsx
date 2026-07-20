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
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { blockUserAction, unblockUserAction } from '@/server/actions/users-actions';
import type { UserListItem, BackendPaginated } from '@/lib/users/types';

interface UsersTableProps {
  initialData: BackendPaginated<UserListItem>;
  currentPage: number;
}

function getInitials(prenom: string, name: string) {
  return `${prenom[0] ?? ''}${name[0] ?? ''}`.toUpperCase();
}

function StatusBadge({ isActive, isVerified }: { isActive: boolean; isVerified: boolean }) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/5 gap-1 text-[11px]">
        <XCircle className="h-3 w-3" />
        Bloqué
      </Badge>
    );
  }
  if (isVerified) {
    return (
      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/5 gap-1 text-[11px]">
        <CheckCircle2 className="h-3 w-3" />
        Vérifié
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/5 text-[11px]">
      Non vérifié
    </Badge>
  );
}

function UserActionButton({ user }: { user: UserListItem }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const action = user.isActive ? blockUserAction : unblockUserAction;
      const result = await action(user.id);
      if (result.success) {
        toast.success(user.isActive ? 'Utilisateur bloqué' : 'Utilisateur débloqué');
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onClick={handleToggle}
      disabled={isPending}
      title={user.isActive ? 'Bloquer' : 'Débloquer'}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : user.isActive ? (
        <ShieldOff className="h-3.5 w-3.5" />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
      )}
    </Button>
  );
}

export function UsersTable({ initialData, currentPage }: UsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'unverified'>('all');

  const filtered = useMemo(() => {
    let list = initialData.data;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.prenom.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q),
      );
    }
    if (statusFilter === 'active') list = list.filter((u) => u.isActive && u.isVerified);
    if (statusFilter === 'blocked') list = list.filter((u) => !u.isActive);
    if (statusFilter === 'unverified') list = list.filter((u) => u.isActive && !u.isVerified);
    return list;
  }, [initialData.data, search, statusFilter]);

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(p));
    router.push(url.pathname + url.search);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Nom, email, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-9 w-40 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs vérifés</SelectItem>
                <SelectItem value="unverified">Non vérifiés</SelectItem>
                <SelectItem value="blocked">Bloqués</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[12px] text-muted-foreground whitespace-nowrap">
              {initialData.total} au total
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Users className="h-8 w-8 opacity-30" />
            <p className="text-sm">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Utilisateur</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Téléphone</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Inscrit le</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((user) => (
                    <tr key={user.id} className="group hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                            {getInitials(user.prenom, user.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {user.prenom} {user.name}
                            </p>
                            <p className="text-[12px] text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{user.phone}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {format(new Date(user.createdAt), 'd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge isActive={user.isActive} isVerified={user.isVerified} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <UserActionButton user={user} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border">
              {filtered.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                    {getInitials(user.prenom, user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{user.prenom} {user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    <div className="mt-1">
                      <StatusBadge isActive={user.isActive} isVerified={user.isVerified} />
                    </div>
                  </div>
                  <UserActionButton user={user} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {initialData.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
            <p className="text-[12px] text-muted-foreground">
              Page {currentPage} sur {initialData.pages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= initialData.pages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
