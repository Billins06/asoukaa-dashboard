'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setAdminPasswordAction } from '@/server/actions/auth-actions';
import { passwordSchema } from '@/lib/password-rules';
import { cn } from '@/lib/utils';

/**
 * Formulaire « Définir mon mot de passe » (lien d'invitation admin).
 *
 * Même approche que le formulaire de connexion : validation Zod côté navigateur
 * pour la rapidité, puis l'action serveur REVALIDE tout (les règles viennent du
 * même fichier lib/password-rules.ts, identiques à celles du serveur).
 * Le jeton et l'e-mail viennent du lien ; ils ne sont pas modifiables ici.
 */

const formSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

// Aide visuelle : on montre en direct quelles règles sont déjà remplies
const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: '8 caractères minimum', test: (v) => v.length >= 8 },
  { label: 'Une minuscule', test: (v) => /[a-z]/.test(v) },
  { label: 'Une majuscule', test: (v) => /[A-Z]/.test(v) },
  { label: 'Un chiffre', test: (v) => /\d/.test(v) },
  { label: 'Un caractère spécial', test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

export function SetPasswordForm({ token, email }: { token: string; email: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Après un succès on garde le formulaire verrouillé pendant la redirection
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password') ?? '';
  const locked = isPending || done;

  function onSubmit(values: FormValues) {
    if (locked) return; // garde-fou anti double soumission
    startTransition(async () => {
      const result = await setAdminPasswordAction({ token, email, ...values });
      if (!result.success) {
        toast.error(result.error);
        reset({ password: '', confirmPassword: '' });
        return;
      }
      setDone(true);
      toast.success('Mot de passe défini');
      // Navigation complète (comme après la connexion) puis message de succès sur /login
      window.location.replace('/login?pwd=ok');
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} readOnly disabled autoComplete="username" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={locked}
            aria-invalid={!!errors.password}
            className="pr-10"
            maxLength={64}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1" aria-label="Règles du mot de passe">
          {RULES.map((rule) => {
            const ok = rule.test(passwordValue);
            return (
              <li
                key={rule.label}
                className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-emerald-600' : 'text-muted-foreground')}
              >
                {ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0 opacity-50" />}
                <span>{rule.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          disabled={locked}
          aria-invalid={!!errors.confirmPassword}
          maxLength={64}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={locked}>
        {locked ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          'Définir mon mot de passe'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Le lien d&apos;invitation est valable 48 heures et ne peut servir qu&apos;une seule fois.
      </p>
    </form>
  );
}
