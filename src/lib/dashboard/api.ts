import 'server-only';

import { api } from '@/lib/api';
import type {
  AdminOverview,
  DashboardPeriod,
  RevenuePoint,
  TopProduct,
  TopVendor,
} from './types';

/**
 * Couche d'accès aux données du dashboard — SERVER ONLY.
 *
 * `import 'server-only'` fait planter le build si quelqu'un importe
 * ce fichier dans un Client Component par erreur → le token JWT
 * ne peut jamais fuiter dans le bundle navigateur.
 *
 * Chaque fonction appelle un endpoint réel du backend NestJS.
 * Les erreurs remontent au Error Boundary de la section concernée
 * (une section qui plante n'empêche pas les autres de s'afficher).
 */

function periodQuery(period: DashboardPeriod): string {
  // Valeur contrôlée par un type union — pas d'injection possible,
  // mais on encode quand même par principe de défense en profondeur.
  return `period=${encodeURIComponent(period)}`;
}

export async function getAdminOverview(period: DashboardPeriod): Promise<AdminOverview> {
  return api.get<AdminOverview>(`/dashboard/admin/overview?${periodQuery(period)}`);
}

export async function getRevenueChart(period: DashboardPeriod): Promise<RevenuePoint[]> {
  return api.get<RevenuePoint[]>(`/dashboard/admin/revenue-chart?${periodQuery(period)}`);
}

export async function getTopProducts(
  period: DashboardPeriod,
  limit = 5,
): Promise<TopProduct[]> {
  return api.get<TopProduct[]>(
    `/dashboard/admin/top-products?${periodQuery(period)}&limit=${limit}`,
  );
}

export async function getTopVendors(
  period: DashboardPeriod,
  limit = 5,
): Promise<TopVendor[]> {
  return api.get<TopVendor[]>(
    `/dashboard/admin/top-vendors?${periodQuery(period)}&limit=${limit}`,
  );
}
