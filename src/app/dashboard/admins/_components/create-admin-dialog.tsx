'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createAdminAction } from '@/server/actions/admins-actions';
import { ADMIN_ROLE, ADMIN_ROLE_LIST, adminRoleMeta, isAdminRole } from '@/lib/status-meta';

export function CreateAdminDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    // Le rôle envoyé doit être « admin » ou « superadmin » (minuscules, enum serveur).
    const role = fd.get('role');
    if (!isAdminRole(role)) {
      setError('Choisissez un rôle.');
      return;
    }

    startTransition(async () => {
      const result = await createAdminAction({
        prenom: String(fd.get('prenom') ?? ''),
        name: String(fd.get('name') ?? ''),
        email: String(fd.get('email') ?? ''),
        role,
      });
      if (result.success) {
        toast.success("Invitation envoyée");
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <Button size="sm" className="h-8 text-[13px]" onClick={() => { setError(null); setOpen(true); }}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Inviter un admin
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!isPending) setOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inviter un administrateur</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground -mt-1">
            Un email d&apos;invitation sera envoyé pour définir le mot de passe.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prenom" className="text-[13px]">Prénom</Label>
                <Input id="prenom" name="prenom" required placeholder="Jean" className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[13px]">Nom</Label>
                <Input id="name" name="name" required placeholder="Dupont" className="h-8 text-[13px]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px]">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="admin@asoukaa.com" className="h-8 text-[13px]" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Rôle</Label>
              <div className="flex gap-4">
                {ADMIN_ROLE_LIST.map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" value={r} defaultChecked={r === ADMIN_ROLE.ADMIN} className="accent-primary" />
                    <span className="text-[13px]">{adminRoleMeta(r).label}</span>
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Un Super Admin peut gérer les autres administrateurs et purger le journal d&apos;activité.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-[12px] text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" className="h-8 text-[13px]" disabled={isPending} onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" className="h-8 text-[13px]" disabled={isPending}>
                {isPending ? 'Envoi...' : "Envoyer l'invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
