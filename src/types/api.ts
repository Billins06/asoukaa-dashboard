/**
 * Types génériques pour les réponses API.
 *
 * À étendre au fur et à mesure que les modules sont implémentés.
 */

/**
 * Réponse paginée standard.
 * Format à confirmer/ajuster selon ce que ton backend NestJS renvoie réellement.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Résultat d'une action API : success/error structuré pour l'UI.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Statuts standards Asoukaa (alignés avec l'enum backend).
 * Utilisés pour vendor_profiles, delivery_agent_profiles, etc.
 */
export enum AsoukaaStatus {
  ATTENTE = 'en attente',
  APPROUVER = 'approuvé',
  REJETER = 'rejeté',
  BLOQUER = 'bloqué',
}
