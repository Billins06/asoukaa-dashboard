/**
 * Types du module « Bannières d'accueil ».
 * Contrat : routes /admin/banners/* du backend (rôle ADMIN/SUPERADMIN).
 */

export type BannerTargetType = 'category' | 'product' | 'shop' | 'link';

/** Statut calculé par le serveur pour la liste du back-office. */
export type BannerStatus = 'visible' | 'inactive' | 'programmee' | 'expiree' | 'cible_invalide';

export interface Banner {
  id: string;
  imageUrl: string;
  titre: string | null;
  sousTitre: string | null;
  targetType: BannerTargetType;
  targetId: string | null;
  targetUrl: string | null;
  /** Nom de la catégorie / du produit / de la boutique visé (ou le lien) */
  targetLabel: string | null;
  /** false = la cible n'existe plus ou n'est plus visible des acheteurs */
  targetValid: boolean;
  durationSeconds: number;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  status: BannerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BannerPayload {
  imageUrl: string;
  titre: string | null;
  sousTitre: string | null;
  targetType: BannerTargetType;
  targetId: string | null;
  targetUrl: string | null;
  durationSeconds: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

/** Résultat du sélecteur de cible (catégorie / produit / boutique). */
export interface TargetOption {
  id: string;
  label: string;
  sublabel: string | null;
  imageUrl: string | null;
}
