'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUserAction } from '@/server/actions/users-actions';
import { PASSWORD_PATTERN, PASSWORD_COMPLEXITY_MESSAGE } from '@/lib/password-rules';
import type { UserRoleValue } from '@/lib/users/types';

const ROLE_LABELS: Record<UserRoleValue, string> = {
  client: 'Client',
  vendor: 'Vendeur',
  delivery_agent: 'Livreur',
};

const EMPTY_FORM = {
  prenom: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'client' as UserRoleValue,
};

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const isValid =
    form.prenom.trim() &&
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.password.trim().length >= 8;

  const handleSubmit = () => {
    if (!isValid) {
      toast.error('Merci de remplir tous les champs obligatoires.');
      return;
    }
    // Mêmes règles que le serveur : on évite un aller-retour pour un mot de passe refusé.
    if (form.password.length > 64) {
      toast.error('Le mot de passe ne doit pas dépasser 64 caractères.');
      return;
    }
    if (!PASSWORD_PATTERN.test(form.password)) {
      toast.error(PASSWORD_COMPLEXITY_MESSAGE);
      return;
    }
    startTransition(async () => {
      const result = await createUserAction(form);
      if (result.success) {
        toast.success('Utilisateur créé avec succès.');
        setOpen(false);
        setForm(EMPTY_FORM);
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
        if (!next) setForm(EMPTY_FORM);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          Créer un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un utilisateur</DialogTitle>
          <DialogDescription>
            Le compte est créé directement actif et vérifié — aucun email OTP n&apos;est envoyé.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prenom" className="text-[13px]">Prénom *</Label>
            <Input
              id="prenom"
              value={form.prenom}
              onChange={(e) => set('prenom')(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[13px]">Nom *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px]">Email *</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-[13px]">Téléphone *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set('phone')(e.target.value)}
            placeholder="+229XXXXXXXX"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px]">Mot de passe temporaire *</Label>
          <Input
            id="password"
            type="text"
            value={form.password}
            onChange={(e) => set('password')(e.target.value)}
            placeholder="Min. 8 caractères, majuscule + chiffre + symbole"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px]">Rôle initial</Label>
          <Select value={form.role} onValueChange={(v) => set('role')(v)}>
            <SelectTrigger className="text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as UserRoleValue[]).map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !isValid}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
