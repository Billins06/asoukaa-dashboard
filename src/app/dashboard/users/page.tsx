import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getUsers } from '@/lib/users/api';
import { UsersTable } from './_components/users-table';
import { UsersTableSkeleton } from './_components/users-skeleton';

export const metadata: Metadata = { title: 'Utilisateurs' };

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Gestion des comptes clients inscrits sur la plateforme
        </p>
      </div>

      <Suspense key={`users-${page}`} fallback={<UsersTableSkeleton />}>
        <UsersTableServer page={page} />
      </Suspense>
    </div>
  );
}

async function UsersTableServer({ page }: { page: number }) {
  const data = await getUsers(page, 20);
  return <UsersTable initialData={data} currentPage={page} />;
}
