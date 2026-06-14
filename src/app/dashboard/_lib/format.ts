import type { DashboardPeriod, RevenuePoint } from '@/lib/dashboard/types';

/**
 * Helpers de formatage pour le dashboard.
 * Locale : fr-FR · Devise : XOF (Franc CFA)
 */

const xofFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0, // le FCFA ne s'écrit pas avec des centimes
});

const numberFormatter = new Intl.NumberFormat('fr-FR');

/** 1234567 → "1 234 567 F CFA" */
export function formatXOF(amount: number): string {
  return xofFormatter.format(amount);
}

/** Version compacte pour les cartes : 1 234 567 → "1,23 M F" */
export function formatXOFCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M F`;
  }
  if (amount >= 10_000) {
    return `${(amount / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k F`;
  }
  return formatXOF(amount);
}

/** 1234 → "1 234" */
export function formatNumber(n: number): string {
  return numberFormatter.format(n);
}

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
