/**
 * Types du module « Vitrine » (rayons + bandeau « Pour vous »).
 * Contrat : routes /admin/vitrine/* du backend (rôle ADMIN/SUPERADMIN).
 */

export type RayonType = 'flash' | 'tendance' | 'succes' | 'libre';

export interface Rayon {
  id: string;
  nom: string;
  type: RayonType;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  /** Produits placés dans le rayon (tous statuts) */
  productCount: number;
  /** Produits réellement visibles par les acheteurs (statut « active ») */
  visibleProductCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Statut produit côté backend (enum ProductStatus). */
export type VitrineProductStatus = 'brouillon' | 'active' | 'inactive' | 'out_of_stock';

/** Produit tel que renvoyé par le détail d'un rayon et par products-search. */
export interface VitrineProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  /** Peut arriver en string si le backend sérialise un Decimal. */
  price: number | string;
  shopName: string | null;
  /** true = visible par les acheteurs (status === 'active') */
  isActive: boolean;
  status: VitrineProductStatus | string;
}

export interface RayonDetail extends Rayon {
  products: VitrineProduct[];
}

export interface CreateRayonPayload {
  nom: string;
  type?: RayonType;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

/** PATCH partiel : imageUrl / startsAt / endsAt acceptent null pour vider. */
export interface UpdateRayonPayload {
  nom?: string;
  type?: RayonType;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface Bandeau {
  id: string;
  titre: string;
  sousTitre: string | null;
  imageUrl: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface SaveBandeauPayload {
  titre: string;
  sousTitre?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

/** Limite du backend pour PUT /rayons/:id/products. */
export const RAYON_MAX_PRODUCTS = 200;

// ─── Meilleures boutiques ──────────────────────────────────

/** Nombre maximum de boutiques dans la liste « Meilleures boutiques ». */
export const BEST_SHOPS_MAX = 20;

export interface BestShopVendor {
  id: string;
  shopName: string;
  logoUrl: string | null;
  /** Statut du vendeur côté backend (« approuvé », « en attente », « rejeté », « bloqué »). */
  status: string;
  /** Boutique visible (le vendeur peut la masquer). */
  shopVisible: boolean;
  /** Compte utilisateur actif. */
  accountActive: boolean;
}

/** Ligne de la liste admin (GET /admin/vitrine/best-shops). */
export interface BestShop {
  /** Identifiant de la ligne featured_shops (≠ vendorId). */
  id: string;
  vendorId: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vendor: BestShopVendor;
  visibleProductCount: number;
  /** true = la boutique apparaît réellement sur l'accueil de l'application. */
  isDisplayed: boolean;
}

/** Vendeur proposé à l'ajout (id = vendorId). */
export interface BestShopCandidate {
  id: string;
  shopName: string;
  logoUrl: string | null;
  shopVisible: boolean;
  visibleProductCount: number;
}

export interface BestShopCandidatesPage {
  data: BestShopCandidate[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
