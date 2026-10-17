'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Pencil, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserAction } from '@/server/actions/users-actions';
import type { UserListItem } from '@/lib/users/types';

interface EditUserDialogProps {
  user: UserListItem;
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    prenom: user.prenom,
    name: user.name,
    email: user.email,
    phone: user.phone,
  });
  const [isPending, startTransition] = useTransition();

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const isValid = form.prenom.trim() && form.name.trim() && form.email.trim() && form.phone.trim();

  const handleSubmit = () => {
    if (!isValid) {
      toast.error('Tous les champs sont obligatoires.');
      return;
    }
    startTransition(async () => {
      const result = await updateUserAction(user.id, form);
      if (result.success) {
        toast.success('Utilisateur mis à jour.');
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setForm({ prenom: user.prenom, name: user.name, email: user.email, phone: user.phone });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Modifier"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          <DialogDescription>
            {user.prenom} {user.name} — les identifiants de connexion (mot de passe) ne sont pas modifiables ici.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-prenom" className="text-[13px]">Prénom *</Label>
            <Input
              id="edit-prenom"
              value={form.prenom}
              onChange={(e) => set('prenom')(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-[13px]">Nom *</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-email" className="text-[13px]">Email *</Label>
          <Input
            id="edit-email"
            type="email"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-phone" className="text-[13px]">Téléphone *</Label>
          <Input
            id="edit-phone"
            value={form.phone}
            onChange={(e) => set('phone')(e.target.value)}
            disabled={isPending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !isValid}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
