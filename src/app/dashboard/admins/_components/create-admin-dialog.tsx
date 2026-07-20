'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createAdminAction } from '@/server/actions/admins-actions';
import type { AdminRole } from '@/lib/admins/types';

export function CreateAdminDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAdminAction({
        prenom: fd.get('prenom') as string,
        name: fd.get('name') as string,
        email: fd.get('email') as string,
        role: fd.get('role') as AdminRole,
      });
      if (result.success) {
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

      <Dialog open={open} onOpenChange={setOpen}>
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
              <div className="flex gap-2">
                {(['ADMIN', 'SUPERADMIN'] as AdminRole[]).map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" value={r} defaultChecked={r === 'ADMIN'} className="accent-primary" />
                    <span className="text-[13px]">{r === 'ADMIN' ? 'Admin' : 'Super Admin'}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" className="h-8 text-[13px]" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" className="h-8 text-[13px]" disabled={isPending}>
                {isPending ? 'Envoi...' : 'Envoyer l\'invitation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
