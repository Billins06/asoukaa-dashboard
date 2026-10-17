'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, CheckCircle2, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction } from '@/server/actions/auth-actions';
import { getSafeRedirect } from '@/lib/safe-redirect';

/**
 * Formulaire de login.
 *
 * Flow :
 *  1. Validation côté client (UX rapide) avec zod
 *  2. Soumission via Server Action `loginAction`
 *  3. Le Server Action valide ENCORE côté serveur, appelle le backend,
 *     pose le cookie httpOnly
 *  4. Si succès → redirection client vers /dashboard (ou ?redirect=...)
 *  5. Si erreur → toast + reset du password (jamais de l'email)
 *
 * UX :
 *  - Loader pendant la soumission
 *  - Bouton voir/cacher mot de passe
 *  - Disable des inputs pendant le pending pour éviter double-submit
 */

const formSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est obligatoire'),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const searchParams = useSearchParams();
  // Sécurité : `?redirect=` n'est accepté que s'il pointe vers le dashboard
  // (voir lib/safe-redirect.ts) — sinon lien piégé = redirection vers un site externe.
  const redirectTo = getSafeRedirect(searchParams.get('redirect'));
  // ?expired=1 : posé par /api/session/expired (jeton expiré, cookie supprimé)
  const sessionExpired = searchParams.get('expired') === '1';
  // ?pwd=ok : posé après la définition du mot de passe (page /set-password)
  const passwordJustSet = searchParams.get('pwd') === 'ok';

  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await loginAction(values);

      if (!result.success) {
        toast.error(result.error);
        // On reset uniquement le mot de passe — l'utilisateur garde son email
        reset({ email: values.email, password: '' });
        return;
      }

      toast.success('Connexion réussie !', { duration: 1200 });
      // window.location garantit que le cookie httpOnly est envoyé dès la
      // prochaine requête — router.push/refresh créaient une race condition
      // dans Next.js 16 qui annulait la navigation.
      window.location.href = redirectTo;
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {sessionExpired && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span>Session expirée, reconnectez-vous</span>
        </div>
      )}
      {passwordJustSet && !sessionExpired && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Mot de passe défini. Vous pouvez maintenant vous connecter.</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@asoukaa.com"
          disabled={isPending}
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isPending}
            aria-invalid={!!errors.password}
            className="pr-10"
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
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connexion...
          </>
        ) : (
          'Se connecter'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center pt-2">
        En cas de problème, contactez le SuperAdmin.
      </p>
    </form>
  );
}
