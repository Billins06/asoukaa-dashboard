'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Error Boundary par section.
 *
 * Si une section du dashboard plante (backend down, requête SQL en erreur),
 * SEULE cette section affiche un message d'erreur — les autres restent visibles.
 * Sans ça, une seule erreur ferait tomber toute la page.
 *
 * (Next.js a error.tsx au niveau page, mais ici on veut une granularité
 * par section, donc un Error Boundary React classique.)
 */

interface Props {
  children: ReactNode;
  sectionName: string;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // ⚠️ En prod : remonter à Sentry avec le nom de la section.
    // Ne jamais log de données métier ni de token.
    console.error(`[Dashboard:${this.props.sectionName}]`, error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/30">
          <CardContent className="py-8 flex flex-col items-center gap-2 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm font-medium">
              Impossible de charger « {this.props.sectionName} »
            </p>
            <p className="text-xs text-muted-foreground">
              Vérifie que le backend est démarré, puis recharge la page.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
