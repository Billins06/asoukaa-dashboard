'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { LocalDate } from '@/components/local-date';
import {
  blockUserAction,
  unblockUserAction,
  ackSecurityAlertAction,
} from '@/server/actions/users-actions';
import { requestSidebarRefresh } from '@/lib/sidebar/events';
import { getRoleNames, hasActiveSecurityAlert, roleLabel } from '@/lib/users/helpers';
import type { UserListItem, BackendPaginated } from '@/lib/users/types';
import { EditUserDialog } from './edit-user-dialog';

interface UsersTableProps {
  initialData: BackendPaginated<UserListItem>;
  currentPage: number;
}

type StatusFilter = 'all' | 'active' | 'blocked' | 'unverified' | 'alerts';

function getInitials(prenom: string, name: string) {
  return `${prenom?.[0] ?? ''}${name?.[0] ?? ''}`.toUpperCase();
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

function RoleBadges({ user }: { user: UserListItem }) {
  const roles = getRoleNames(user.roles);
  if (roles.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <Badge key={r} variant="outline" className="text-[11px] font-normal">
          {roleLabel(r)}
        </Badge>
      ))}
    </div>
  );
}

function UserActionButton({ user }: { user: UserListItem }) {
  const blocking = user.isActive;
  const fullName = `${user.prenom} ${user.name}`.trim();

  const handleConfirm = async () => {
    try {
      const result = await (blocking ? blockUserAction : unblockUserAction)(user.id);
      if (result.success) {
        toast.success(blocking ? 'Utilisateur bloqué' : 'Utilisateur débloqué');
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Le serveur ne répond pas. Réessayez dans un instant.');
    }
  };

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={blocking ? 'Bloquer' : 'Débloquer'}
          aria-label={blocking ? `Bloquer ${fullName}` : `Débloquer ${fullName}`}
        >
          {blocking ? (
            <ShieldOff className="h-3.5 w-3.5" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          )}
        </Button>
      }
      title={blocking ? 'Bloquer cet utilisateur ?' : 'Débloquer cet utilisateur ?'}
      description={
        blocking
          ? `${fullName || user.email} ne pourra plus se connecter tant que son compte sera bloqué.`
          : `${fullName || user.email} pourra de nouveau se connecter à son compte.`
      }
      confirmLabel={blocking ? 'Bloquer' : 'Débloquer'}
      tone={blocking ? 'destructive' : 'default'}
      onConfirm={handleConfirm}
    />
  );
}

/** Pastille de la colonne « Sécurité » : cliquable, ouvre le détail de l'alerte. */
function SecurityBadge({ user, onOpen }: { user: UserListItem; onOpen: () => void }) {
  if (!user.securityAlertAt) return <span className="text-muted-foreground">—</span>;
  const active = hasActiveSecurityAlert(user);
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Voir le détail de l'alerte"
      aria-label={`${active ? 'Alerte de sécurité à traiter' : 'Alerte de sécurité traitée'} : voir le détail`}
      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {active ? (
        <Badge className="gap-1 border-red-600/40 bg-red-600 text-[11px] text-white">
          <ShieldAlert className="h-3 w-3" />
          Alerte
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          Traitée
        </Badge>
      )}
    </button>
  );
}

function SecurityAlertDialog({
  user,
  onClose,
  onAcked,
}: {
  user: UserListItem | null;
  onClose: () => void;
  onAcked: (userId: string, ackedAt: string) => void;
}) {
  // On garde le dernier utilisateur affiché pour que la fenêtre ne se vide pas
  // pendant son animation de fermeture.
  const [last, setLast] = useState<UserListItem | null>(user);
  if (user && user !== last) setLast(user);
  const shown = user ?? last;
  const active = shown ? hasActiveSecurityAlert(shown) : false;

  const handleAck = async () => {
    if (!shown) return;
    try {
      const result = await ackSecurityAlertAction(shown.id);
      if (result.success) {
        toast.success('Alerte marquée comme traitée.');
        onAcked(shown.id, result.data?.securityAlertAckedAt ?? new Date().toISOString());
        requestSidebarRefresh();
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Le serveur ne répond pas. Réessayez dans un instant.');
    }
  };

  return (
    <Dialog open={user !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {shown && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className={`h-4 w-4 ${active ? 'text-red-600' : 'text-muted-foreground'}`} />
                Alerte de sécurité
              </DialogTitle>
              <DialogDescription>
                {shown.prenom} {shown.name} · {shown.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-[13px]">
              <p className="text-muted-foreground">
                Le propriétaire du compte a répondu « Ce n&apos;est pas moi » à un changement
                d&apos;adresse e-mail.
              </p>
              <dl className="space-y-2.5 rounded-lg border border-border p-3">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Alerte reçue le</dt>
                  <dd className="font-medium">
                    <LocalDate iso={shown.securityAlertAt} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Situation</dt>
                  <dd>
                    {active ? (
                      <Badge className="border-red-600/40 bg-red-600 text-[11px] text-white">À traiter</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px]">Traitée</Badge>
                    )}
                  </dd>
                </div>
                {shown.securityAlertAckedAt && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Dernier traitement le</dt>
                    <dd className="font-medium">
                      <LocalDate iso={shown.securityAlertAckedAt} />
                    </dd>
                  </div>
                )}
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Motif</dt>
                  {/* Texte brut : écrit par un utilisateur, jamais interprété comme du HTML */}
                  <dd className="whitespace-pre-wrap break-words rounded-md bg-muted/50 px-2.5 py-2">
                    {shown.securityAlertReason?.trim() || 'Aucun motif indiqué.'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              {active && (
                <ConfirmDialog
                  trigger={<Button>Marquer comme traité</Button>}
                  title="Marquer cette alerte comme traitée ?"
                  description="Vérifiez d'abord que le compte est sûr (contact avec le propriétaire, e-mail rétabli…). L'alerte disparaîtra de la liste des alertes à traiter et du menu."
                  confirmLabel="Marquer comme traité"
                  onConfirm={handleAck}
                />
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UsersTable({ initialData, currentPage }: UsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [alertUserId, setAlertUserId] = useState<string | null>(null);
  // Acquittements confirmés par le serveur, appliqués tout de suite à l'écran
  // (la liste réelle se recharge ensuite toute seule).
  const [ackedLocal, setAckedLocal] = useState<Record<string, string>>({});

  const users = useMemo(
    () =>
      initialData.data.map((u) =>
        ackedLocal[u.id] ? { ...u, securityAlertAckedAt: ackedLocal[u.id] } : u,
      ),
    [initialData.data, ackedLocal],
  );

  const alertUser = alertUserId ? users.find((u) => u.id === alertUserId) ?? null : null;
  const activeAlertsOnPage = useMemo(() => users.filter(hasActiveSecurityAlert).length, [users]);

  const filtered = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.prenom ?? '').toLowerCase().includes(q) ||
          (u.name ?? '').toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q) ||
          (u.phone ?? '').includes(q),
      );
    }
    if (statusFilter === 'active') list = list.filter((u) => u.isActive && u.isVerified);
    if (statusFilter === 'blocked') list = list.filter((u) => !u.isActive);
    if (statusFilter === 'unverified') list = list.filter((u) => u.isActive && !u.isVerified);
    if (statusFilter === 'alerts') list = list.filter(hasActiveSecurityAlert);
    return list;
  }, [users, search, statusFilter]);

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(Math.max(1, p)));
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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="h-9 w-44 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs vérifiés</SelectItem>
                <SelectItem value="unverified">Non vérifiés</SelectItem>
                <SelectItem value="blocked">Bloqués</SelectItem>
                <SelectItem value="alerts">Alertes de sécurité</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[12px] text-muted-foreground whitespace-nowrap">
              {initialData.total} au total
            </span>
          </div>
        </div>
        {activeAlertsOnPage > 0 && statusFilter !== 'alerts' && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-red-600">
            <ShieldAlert className="h-3.5 w-3.5" />
            {activeAlertsOnPage} alerte{activeAlertsOnPage > 1 ? 's' : ''} de sécurité à traiter sur cette page.
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Users className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {statusFilter === 'alerts'
                ? 'Aucune alerte de sécurité à traiter sur cette page'
                : 'Aucun utilisateur trouvé'}
            </p>
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
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Rôle(s)</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Inscrit le</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Sécurité</th>
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
                      <td className="px-4 py-3.5">
                        <RoleBadges user={user} />
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <LocalDate iso={user.createdAt} pattern="d MMM yyyy" />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge isActive={user.isActive} isVerified={user.isVerified} />
                      </td>
                      <td className="px-4 py-3.5">
                        <SecurityBadge user={user} onOpen={() => setAlertUserId(user.id)} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditUserDialog user={user} />
                          <UserActionButton user={user} />
                        </div>
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
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <StatusBadge isActive={user.isActive} isVerified={user.isVerified} />
                      <SecurityBadge user={user} onOpen={() => setAlertUserId(user.id)} />
                    </div>
                    {getRoleNames(user.roles).length > 0 && (
                      <div className="mt-1">
                        <RoleBadges user={user} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <EditUserDialog user={user} />
                    <UserActionButton user={user} />
                  </div>
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
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= initialData.pages}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <SecurityAlertDialog
        user={alertUser}
        onClose={() => setAlertUserId(null)}
        onAcked={(userId, ackedAt) => setAckedLocal((prev) => ({ ...prev, [userId]: ackedAt }))}
      />
    </Card>
  );
}
