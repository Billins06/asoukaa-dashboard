import type { OrderStatus } from '@/lib/status-meta';
import type { Paginated } from '@/lib/pagination';

/** Valeurs EXACTES du serveur (« en attente », « expedié »…) : voir lib/status-meta.ts. */
export type { OrderStatus };

export interface OrderVendor {
  id: string;
  shopName: string;
}

/** Adresse de livraison (entité Address du serveur). */
export interface OrderAddress {
  id: string;
  label?: string | null;
  nom_destinataire?: string | null;
  quartier?: string | null;
  ville?: string | null;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  /** Décimaux Postgres : le serveur les sérialise en TEXTE ("12500.00"). */
  total: string | number;
  subtotal: string | number;
  fraisLivraison: string | number;
  montantCommission: string | number;
  motifAnnulation?: string | null;
  /**
   * true = le client a contesté la réception (livraison bus/taxi « expedié ») :
   * un admin doit clore le litige. Colonne de la table orders, renvoyée telle quelle
   * par GET /orders (le serveur ne retire aucune colonne).
   */
  disputeOuverte?: boolean;
  createdAt: string;
  updatedAt: string;
  vendor: OrderVendor | null;
  address?: OrderAddress | null;
}

export type BackendPaginated<T> = Paginated<T>;

/** Décision d'un admin pour clore un litige (PATCH /orders/:id/admin-close-dispute). */
export type DisputeDecision = 'rejete' | 'fonde';

/**
 * Réponse de PATCH /orders/:id/admin-status (annulation) et de admin-close-dispute.
 * `remboursementManuelRequis` n'est présent que pour une annulation.
 */
export interface OrderAdminResult {
  remboursementManuelRequis: boolean;
  orderNumber?: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  motifAnnulation?: string;
}

// ─── Commandes en retard de confirmation ───────────────────

/** 'reminder' = délai de rappel dépassé · 'alert' = délai d'alerte admin dépassé. */
export type LateConfirmationLevel = 'reminder' | 'alert';

export interface LateConfirmationOrder {
  id: string;
  orderNumber: string;
  /** Statut brut renvoyé par le backend (texte français). */
  status: string;
  /** Décimal Postgres sérialisé en chaîne. */
  total: string | number;
  createdAt: string;
  waitingSince: string;
  hoursWaiting: number;
  stage: LateConfirmationLevel;
  vendorReminderSentAt: string | null;
  adminAlertedAt: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  vendor: { id: string; userId: string | null; shopName: string; phone: string | null };
  customer: { id: string | null; prenom: string | null; name: string | null };
}

export interface LateConfirmationResponse extends Paginated<LateConfirmationOrder> {
  thresholds: { reminderHours: number; adminAlertHours: number };
}
