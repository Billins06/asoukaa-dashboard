/**
 * Compteurs affichés en pastilles dans le menu latéral.
 * Réponse de GET /api/v1/admin/sidebar-counts.
 */
export interface SidebarCounts {
  /** Candidatures vendeurs en attente de validation */
  vendors: number;
  /** Candidatures livreurs en attente de validation */
  agents: number;
  /** Tickets de support ouverts / à traiter */
  supportTickets: number;
  /** Demandes de remboursement en attente */
  refunds: number;
  /** Commandes à confirmer */
  ordersToConfirm: number;
  /** Alertes de sécurité non acquittées (comptes) */
  securityAlerts: number;
  /**
   * Paiements reçus (client débité) mais commande non validée : à examiner à la main.
   * Optionnel : un serveur plus ancien ne l'envoie pas, on compte alors 0 (pas de pastille).
   */
  paymentsToReview?: number;
}

export type SidebarCountKey = keyof SidebarCounts;

export const SIDEBAR_COUNT_KEYS: readonly SidebarCountKey[] = [
  'vendors',
  'agents',
  'supportTickets',
  'refunds',
  'ordersToConfirm',
  'securityAlerts',
  'paymentsToReview',
];
