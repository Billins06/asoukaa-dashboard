import type { DashboardPeriod, RevenuePoint } from '@/lib/dashboard/types';

/**
 * Helpers de formatage pour le dashboard.
 * Locale : fr-FR · Devise : FCFA (Franc CFA)
 *
 * Les montants passent par src/lib/format.ts : une seule écriture « FCFA »
 * (Intl XOF produisait « F CFA »). Les anciens noms formatXOF* restent
 * exportés pour ne pas casser les graphiques qui les importent.
 */

export {
  formatFCFA as formatXOF,
  formatFCFACompact as formatXOFCompact,
  formatNumber,
} from '@/lib/format';

/** '2026-06-10' → '10 juin' */
export function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Le backend ne renvoie que les jours AVEC commandes.
 * Pour un graphique lisible, on remplit les jours manquants avec 0
 * (sinon la courbe "saute" des jours et la pente ment visuellement).
 */
export function fillMissingDays(
  data: RevenuePoint[],
  period: DashboardPeriod,
): RevenuePoint[] {
  if (period === 'today') return data; // un seul jour, rien à remplir

  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const byDate = new Map(data.map((d) => [d.date.slice(0, 10), d]));

  const filled: RevenuePoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    filled.push(
      byDate.get(key) ?? { date: key, revenue: 0, orderCount: 0 },
    );
  }

  // Pour 'year', 365 points c'est trop → on agrège par mois
  if (period === 'year') {
    const byMonth = new Map<string, RevenuePoint>();
    for (const point of filled) {
      const monthKey = point.date.slice(0, 7); // 'YYYY-MM'
      const existing = byMonth.get(monthKey);
      if (existing) {
        existing.revenue += point.revenue;
        existing.orderCount += point.orderCount;
      } else {
        byMonth.set(monthKey, { ...point, date: `${monthKey}-01` });
      }
    }
    return Array.from(byMonth.values());
  }

  return filled;
}
