import type { Metadata } from 'next';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorPanel } from '@/components/error-panel';

export const metadata: Metadata = { title: 'Page introuvable' };

/** Page 404 (adresse inconnue). Aussi utilisée par dashboard/not-found.tsx. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ErrorPanel
        icon={<FileQuestion className="h-6 w-6" />}
        title="Page introuvable"
        description="Cette page n'existe pas ou a été déplacée."
      >
        <Button asChild>
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </ErrorPanel>
    </main>
  );
}
