/**
 * Types du dashboard admin — alignés EXACTEMENT sur les réponses
 * du backend NestJS (dashboard.service.ts, branche asoukaa_backend).
 *
 * Endpoints :
 *  - GET /dashboard/admin/overview?period=
 *  - GET /dashboard/admin/revenue-chart?period=
 *  - GET /dashboard/admin/top-products?period=&limit=
 *  - GET /dashboard/admin/top-vendors?period=&limit=
 */

import { ORDER_STATUS_LIST, ORDER_STATUS_META, type OrderStatus } from '@/lib/status-meta';

export type DashboardPeriod = 'today' | 'week' | 'month' | 'year';

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: "Aujourd'hui",
  week: '7 derniers jours',
  month: '30 derniers jours',
  year: '12 derniers mois',
};

/**
 * Statuts de commande : le serveur les renvoie EN FRANÇAIS (« en attente »,
 * « expedié »…, avec ses fautes d'origine). Source unique : lib/status-meta.ts.
 */
export type OrderStatusValue = OrderStatus;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = Object.fromEntries(
  ORDER_STATUS_LIST.map((s) => [s, ORDER_STATUS_META[s].label]),
) as Record<OrderStatus, string>;

/** Réponse de GET /dashboard/admin/overview */
export interface AdminOverview {
  counters: {
    totalUsers: number;
    totalVendors: number;
    totalAgents: number;
    totalProducts: number;
    pendingVendors: number;
    pendingAgents: number;
    pendingReviews: number;
  };
  period: {
    start: string;
    end: string;
    totalOrders: number;
    totalRevenue: number;
    totalCommissions: number;
    ordersByStatus: Array<{
      status: OrderStatusValue | string; // une valeur inconnue du serveur ne doit pas planter
      count: string; // ⚠️ COUNT() SQL renvoie une string via getRawMany
    }>;
  };
}

/** Élément de GET /dashboard/admin/revenue-chart */
export interface RevenuePoint {
  date: string; // 'YYYY-MM-DD'
  revenue: number;
  orderCount: number;
}

/** Élément de GET /dashboard/admin/top-products */
export interface TopProduct {
  /** null si le produit a été supprimé depuis la vente. */
  productId: string | null;
  productName: string | null;
  totalSold: number;
  totalRevenue: number;
}

/** Élément de GET /dashboard/admin/top-vendors */
export interface TopVendor {
  /** null si la boutique n'existe plus. */
  vendorId: string | null;
  shopName: string | null;
  totalOrders: number;
  totalRevenue: number;
}
