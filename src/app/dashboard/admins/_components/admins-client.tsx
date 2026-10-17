'use client';

import { useState, useTransition, useCallback } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, UserX, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { ADMIN_ROLE, adminRoleMeta, BADGE_TONE } from '@/lib/status-meta';
import { CreateAdminDialog } from './create-admin-dialog';
import { deactivateAdminAction } from '@/server/actions/admins-actions';
import type { AdminAccount, AdminListResponse } from '@/lib/admins/types';

interface AdminsClientProps {
  data: AdminListResponse;
  currentPage: number;
}

function DeactivateButton({ admin }: { admin: AdminAccount }) {
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  // Rien à proposer pour un compte déjà désactivé, ni pour un superadmin (le serveur refuse).
  if (!admin.isActive || admin.role === ADMIN_ROLE.SUPERADMIN) return null;

  if (!confirmed) {
    return (
      <Button
        size="sm" variant="ghost"
        className="h-7 text-[12px] text-muted-foreground hover:text-destructive"
        onClick={() => setConfirmed(true)}
      >
        <UserX className="h-3 w-3 mr-1" />
        Désactiver
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-muted-foreground">Confirmer ?</span>
      <Button
        size="sm" variant="ghost"
        className="h-6 text-[11px] text-destructive hover:bg-destructive/10"
        disabled={isPending}
        onClick={() => startTransition(async () => {
          const result = await deactivateAdminAction(admin.id);
          // Avant : l'échec était ignoré en silence.
          if (result.success) toast.success('Administrateur désactivé');
          else toast.error(result.error);
          setConfirmed(false);
        })}
      >
        {isPending ? '...' : 'Oui'}
      </Button>
      <Button size="sm" variant="ghost" className="h-6 text-[11px]" disabled={isPending} onClick={() => setConfirmed(false)}>
        Non
      </Button>
    </div>
  );
}

export function AdminsClient({ data, currentPage }: AdminsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goPage = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">{data.total} administrateur{data.total > 1 ? 's' : ''}</p>
        <CreateAdminDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          {data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucun administrateur</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dernier login</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Créé le</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map((admin) => {
                    const role = adminRoleMeta(admin.role);
                    return (
                      <tr key={admin.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {admin.prenom} {admin.name}
                          {!admin.isPasswordSet && (
                            <Badge variant="outline" className={cn('ml-2 text-[10px]', BADGE_TONE.amber)}>
                              <Clock className="h-2.5 w-2.5 mr-0.5" />
                              Invitation en attente
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn('text-[11px]', role.badge)}>
                            {role.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn('text-[11px]', admin.isActive ? BADGE_TONE.emerald : BADGE_TONE.slate)}
                          >
                            {admin.isActive ? 'Actif' : 'Désactivé'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[12px]">
                          <LocalDate iso={admin.lastLoginAt} pattern="d MMM yyyy HH:mm" />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[12px]">
                          <LocalDate iso={admin.createdAt} pattern="d MMM yyyy" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DeactivateButton admin={admin} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data.pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-[13px] text-muted-foreground">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" aria-label="Page précédente" disabled={currentPage <= 1} onClick={() => goPage(currentPage - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[12px]">Page {currentPage} / {data.pages}</span>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" aria-label="Page suivante" disabled={currentPage >= data.pages} onClick={() => goPage(currentPage + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
