import type { RefundStatus } from '@/lib/status-meta';
import type { Paginated } from '@/lib/pagination';

/** Valeurs EXACTES du serveur : « en attente » · « approuvé » · « rejetté » (2 t) · « traité » (voir lib/status-meta.ts). */
export type { RefundStatus };

export interface RefundOrder {
  id: string;
  orderNumber: string;
  /** Le serveur joint le client de la commande (mot de passe retiré). */
  user?: { id: string; prenom: string | null; name: string | null } | null;
}

export interface RefundListItem {
  id: string;
  paymentId: string;
  orderId: string;
  order: RefundOrder | null;
  /** Décimal Postgres : TEXTE côté serveur ("12500.00"). */
  montantRemb: string | number;
  motif: string | null;
  status: RefundStatus;
  dateDemande: string;
  processedAt: string | null;
  updatedAt: string;
}

export type BackendPaginated<T> = Paginated<T>;

/** Ce que le serveur a repris au vendeur à l'approbation (tout est facultatif : on lit avec prudence). */
export interface RefundClawback {
  montantVendeur?: number | string | null;
  montantCommission?: number | string | null;
  proportion?: number | string | null;
  dejaRepris?: boolean | null;
  note?: string | null;
}

/** Réponse de PATCH /payments/refunds/:id/approve. */
export interface ApproveRefundResult {
  message?: string;
  status?: string;
  repriseGains?: RefundClawback | null;
  /** > 0 : le vendeur avait déjà retiré l'argent (il est en dette). */
  detteVendeur?: number | string | null;
}

/** Réponse de PATCH /payments/refunds/:id/processed. */
export interface ProcessedRefundResult {
  message?: string;
  refundId?: string;
  status?: string;
  note?: string | null;
}
