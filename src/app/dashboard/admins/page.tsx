import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getAdmins } from '@/lib/admins/api';
import { AdminsClient } from './_components/admins-client';

export const metadata: Metadata = { title: 'Administrateurs' };

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function AdminsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? '1'));

  try {
    const data = await getAdmins(page);
    return <AdminsClient data={data} currentPage={page} />;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les administrateurs : {msg}</span>
      </div>
    );
  }
}

function AdminsSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AdminsPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administrateurs</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Gestion des comptes administrateurs (Superadmin uniquement)
          </p>
        </div>
      </div>
      <Suspense fallback={<AdminsSkeleton />}>
        <AdminsContent {...props} />
      </Suspense>
    </div>
  );
}
