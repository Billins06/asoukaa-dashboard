'use client';

import { LogOut, User as UserIcon, Bell, ChevronDown } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
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
      } catch {
        toast.error('Erreur lors de la déconnexion');
      }
    });
  }

  const initials = `${user.prenom?.[0] || ''}${user.name?.[0] || ''}`.toUpperCase() || 'A';
  const roleLabel = user.role === 'superadmin' ? 'Super Admin' : 'Admin';

  return (
    <header className="h-14 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 bg-background/80 backdrop-blur-md border-b border-border/60">
      {/* Gauche : slot page title / breadcrumb */}
      <div className="flex-1" />

      {/* Droite : actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-[1.05rem] w-[1.05rem]" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1.5" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 h-9 pl-2 pr-2.5 rounded-lg hover:bg-accent/60"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-[13px] font-semibold">
                  {user.prenom} {user.name}
                </span>
                <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal py-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {user.prenom} {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled className="text-muted-foreground">
              <UserIcon className="mr-2 h-4 w-4" />
              Mon profil
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              disabled={isPending}
              className="text-destructive focus:text-destructive focus:bg-destructive/8"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isPending ? 'Déconnexion…' : 'Se déconnecter'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
