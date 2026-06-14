import type { Metadata } from 'next';
import { Suspense } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { getCurrentUser } from '@/lib/auth';
import type { DashboardPeriod } from '@/lib/dashboard/types';

import { PeriodSelector } from './_components/period-selector';
import { KpiCards } from './_components/kpi-cards';
import { ChartsSection } from './_components/charts-section';
import { TopsSection } from './_components/tops-section';
import { SectionErrorBoundary } from './_components/section-error-boundary';
import { KpiCardsSkeleton, ChartsSkeleton, TopsSkeleton } from './_components/skeletons';

export const metadata: Metadata = {
  title: 'Vue globale',
};

const VALID_PERIODS: DashboardPeriod[] = ['today', 'week', 'month', 'year'];

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardHomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const period: DashboardPeriod = VALID_PERIODS.includes(params.period as DashboardPeriod)
    ? (params.period as DashboardPeriod)
    : 'month';

  const user = await getCurrentUser();

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bonjour, {user?.prenom} 👋
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{todayCapitalized}</p>
        </div>
        <PeriodSelector current={period} />
      </div>

      {/* KPIs */}
      <SectionErrorBoundary sectionName="Indicateurs clés">
        <Suspense key={`kpis-${period}`} fallback={<KpiCardsSkeleton />}>
          <KpiCards period={period} />
        </Suspense>
      </SectionErrorBoundary>

      {/* Graphiques */}
      <SectionErrorBoundary sectionName="Graphiques">
        <Suspense key={`charts-${period}`} fallback={<ChartsSkeleton />}>
          <ChartsSection period={period} />
        </Suspense>
      </SectionErrorBoundary>

      {/* Tops */}
      <SectionErrorBoundary sectionName="Classements">
        <Suspense key={`tops-${period}`} fallback={<TopsSkeleton />}>
          <TopsSection period={period} />
        </Suspense>
      </SectionErrorBoundary>
    </div>
  );
}
