import type { Paginated } from '@/lib/pagination';

/**
 * Un paiement de la liste GET /api/v1/payments (admin).
 * Avec ?toReview=true : paiements restés « en attente » mais pour lesquels l'opérateur
 * a bien débité le client (référence opérateur présente) et dont la commande n'a pas
 * pu être validée (stock insuffisant, commande annulée entre-temps...).
 *
 * ⚠️ Le serveur joint la commande et sa boutique, PAS le client : on ne reçoit que
 * l'identifiant du client (`order.userId`), jamais son nom.
 */
export interface PaymentToReviewOrder {
  id: string;
  orderNumber: string;
  /** Statut de la commande (valeur brute du serveur, ex. « annulé »). */
  status: string;
  userId?: string | null;
  motifAnnulation?: string | null;
  vendor?: { id: string; shopName: string } | null;
}

export interface PaymentToReviewItem {
  id: string;
  orderId: string;
  order: PaymentToReviewOrder | null;
  method: string;
  operator: string | null;
  /** Statut du paiement (valeur brute du serveur). */
  status: string;
  /** Référence donnée par l'opérateur (MTN, Moov...). */
  providerRef: string | null;
  /** Décimal Postgres : TEXTE côté serveur ("12500.00"). */
  montant: string | number;
  createdAt: string;
}

export type BackendPaginated<T> = Paginated<T>;
