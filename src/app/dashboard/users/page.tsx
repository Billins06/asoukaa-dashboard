import type { Metadata } from 'next';
import { Suspense } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { InlineError, errorMessage } from '@/components/inline-error';
import { getUsers } from '@/lib/users/api';
import { UsersTable } from './_components/users-table';
import { UsersTableSkeleton } from './_components/users-skeleton';
import { CreateUserDialog } from './_components/create-user-dialog';

export const metadata: Metadata = { title: 'Utilisateurs' };

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '', 10) || 1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Gestion des comptes clients inscrits sur la plateforme
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <Suspense key={`users-${page}`} fallback={<UsersTableSkeleton />}>
        <UsersTableServer page={page} />
      </Suspense>
    </div>
  );
}

async function UsersTableServer({ page }: { page: number }) {
  let data;
  try {
    data = await getUsers(page, 20);
  } catch (error) {
    unstable_rethrow(error);
    return <InlineError title="Impossible de charger les utilisateurs." message={errorMessage(error)} />;
  }
  return <UsersTable initialData={data} currentPage={page} />;
}
