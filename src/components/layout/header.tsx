'use client';

import { LogOut, User as UserIcon } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/server/actions/auth-actions';
import type { AdminUser } from '@/types/auth';

interface HeaderProps {
  user: AdminUser;
}

export function Header({ user }: HeaderProps) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      try {
        await logoutAction();
      } catch (error) {
        // logoutAction redirige déjà en cas de succès, donc on n'arrive ici qu'en cas d'erreur
        toast.error('Erreur lors de la déconnexion');
      }
    });
  }

  const initials = `${user.prenom?.[0] || ''}${user.name?.[0] || ''}`.toUpperCase() || 'A';
  const roleLabel = user.role === 'superadmin' ? 'Super Admin' : 'Admin';

  return (
    <header className="h-16 sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4 lg:px-8">
      {/* Côté gauche : titre de page dynamique (rempli plus tard par chaque page) */}
      <div className="flex-1">
        {/* Slot vide pour l'instant — chaque page peut afficher son breadcrumb ici */}
      </div>

      {/* Côté droit : menu utilisateur */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-3 h-auto py-2 pl-2 pr-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium leading-tight">
                {user.prenom} {user.name}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">{roleLabel}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate">
                {user.prenom} {user.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Mon profil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            disabled={isPending}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isPending ? 'Déconnexion...' : 'Se déconnecter'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
