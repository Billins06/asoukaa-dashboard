import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { APP_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Connexion',
};

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-xl border-border/50">
      <CardHeader className="space-y-1 text-center pb-6">
        {/* Logo placeholder — remplacer par un <Image src="/logo.svg" /> quand le logo sera prêt */}
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
          A
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight pt-2">
          {APP_CONFIG.name}
        </CardTitle>
        <CardDescription>
          Connectez-vous à votre espace d'administration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
