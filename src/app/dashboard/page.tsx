import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Vue globale',
};

/**
 * Dashboard home — placeholder pour la Phase 1.
 * La vraie vue globale (KPIs, graphiques, top 5) sera développée en Phase 2.
 */
export default async function DashboardHomePage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenue, {user?.prenom} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vue d'ensemble de votre marketplace Asoukaa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phase 1 terminée — Authentification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            ✅ Tu es connecté en tant que <strong className="text-foreground">{user?.email}</strong>{' '}
            avec le rôle{' '}
            <strong className="text-foreground">
              {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
            </strong>
            .
          </p>
          <p>
            La <strong className="text-foreground">Phase 2</strong> apportera les vrais KPIs : chiffre
            d'affaires, commandes en cours, demandes en attente, graphiques sur 30 jours, top 5
            produits et boutiques.
          </p>
        </CardContent>
      </Card>

      {/* Placeholders pour donner une idée de la grille à venir */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Chiffre d\'affaires (mois)', value: '—' },
          { label: 'Commandes en cours', value: '—' },
          { label: 'Vendeurs à valider', value: '—' },
          { label: 'Livreurs à valider', value: '—' },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-dashed">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-semibold mt-2 text-muted-foreground/50">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
