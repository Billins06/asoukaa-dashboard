import type { CommissionStatus } from '@/lib/status-meta';
import type { Paginated } from '@/lib/pagination';

/** Valeurs EXACTES du serveur : « en attente » · « payé » (voir lib/status-meta.ts). */
export type { CommissionStatus };

export interface CommissionVendor {
  id: string;
  shopName: string;
}

export interface CommissionOrder {
  id: string;
  orderNumber: string;
}

/** Les montants et le taux sont des décimaux Postgres : TEXTE côté serveur ("2500.00"). */
export interface CommissionListItem {
  id: string;
  orderId: string;
  order: CommissionOrder | null;
  vendorId: string;
  vendor: CommissionVendor | null;
  totalCommande: string | number;
  taux: string | number;
  montantCommission: string | number;
  commissionVendor: string | number;
  status: CommissionStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionCounter {
  count: number;
  amount: number;
}

/** Réponse réelle de GET /admin/commissions/stats/overview (commissions.service.ts › getStatistics). */
export interface CommissionStats {
  pending: CommissionCounter;
  paid: CommissionCounter;
  total: CommissionCounter;
}

export type BackendPaginated<T> = Paginated<T>;
