import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SetPasswordForm } from '@/components/auth/set-password-form';
import { APP_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Définir mon mot de passe',
  // La page contient un jeton d'invitation dans son adresse : jamais d'indexation
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string | string[]; email?: string | string[] }>;
}

const TOKEN_PATTERN = /^[0-9a-f-]{36}$/i;

/** Un paramètre répété (?token=a&token=b) arrive en tableau : on ne garde que le premier. */
function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

/**
 * Page publique ouverte depuis l'e-mail d'invitation :
 *   {FRONTEND_WEB_URL}/set-password?token=<uuid>&email=<adresse>
 *
 * Elle ne fait que lire le lien et afficher le formulaire ; la vraie vérification
 * (jeton valide, non expiré, mot de passe pas déjà défini) est faite par le serveur
 * lors de l'envoi.
 */
export default async function SetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = first(params.token).trim();
  // Le serveur n'encode pas l'e-mail dans le lien : un « + » (alias d'adresse) y devient
  // une espace à la lecture. Une adresse e-mail ne contient jamais d'espace : on le rétablit.
  const email = first(params.email).trim().replace(/ /g, '+').toLowerCase();

  const linkIsValid = TOKEN_PATTERN.test(token) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

  return (
    <Card className="w-full max-w-md shadow-xl border-border/50">
      <CardHeader className="space-y-1 text-center pb-6">
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
          A
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight pt-2">{APP_CONFIG.name}</CardTitle>
        <CardDescription>
          {linkIsValid
            ? 'Bienvenue ! Choisissez le mot de passe de votre compte administrateur.'
            : "Le lien d'invitation est incomplet ou invalide."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {linkIsValid ? (
          <SetPasswordForm token={token} email={email} />
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ouvrez le lien tel qu&apos;il figure dans votre e-mail d&apos;invitation, ou demandez au SuperAdmin de vous
              envoyer une nouvelle invitation.
            </p>
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Aller à la connexion
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
