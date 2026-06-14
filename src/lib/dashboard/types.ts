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

export type DashboardPeriod = 'today' | 'week' | 'month' | 'year';

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: "Aujourd'hui",
  week: '7 derniers jours',
  month: '30 derniers jours',
  year: '12 derniers mois',
};

/** Statuts de commande (enum backend OrderStatus) */
export type OrderStatusValue =
  | 'pending'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  pending: 'En attente',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

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
      status: OrderStatusValue;
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
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

/** Élément de GET /dashboard/admin/top-vendors */
export interface TopVendor {
  vendorId: string;
  shopName: string;
  totalOrders: number;
  totalRevenue: number;
}
