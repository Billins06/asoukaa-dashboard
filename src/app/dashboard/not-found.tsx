import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorPanel } from '@/components/error-panel';

/** 404 déclenchée par notFound() dans une page du dashboard : le menu reste affiché. */
export default function DashboardNotFound() {
  return (
    <div className="py-10">
      <ErrorPanel
        icon={<FileQuestion className="h-6 w-6" />}
        title="Élément introuvable"
        description="Cet élément n'existe pas ou a été supprimé."
      >
        <Button asChild>
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </ErrorPanel>
    </div>
  );
}
