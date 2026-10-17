import type { ReviewStatus } from '@/lib/status-meta';
import type { Paginated } from '@/lib/pagination';

/** Valeurs EXACTES du serveur : « en attente » · « approuvé » · « rejeté » (voir lib/status-meta.ts). */
export type { ReviewStatus };

export interface ReviewUser {
  id: string;
  prenom: string | null;
  name: string | null;
}

/** Le nom du produit s'appelle `prod_name` côté serveur (et non `name`). */
export interface ReviewProduct {
  id: string;
  prod_name: string | null;
}

export interface ReviewListItem {
  id: string;
  userId: string;
  user: ReviewUser | null;
  productId: string;
  product: ReviewProduct | null;
  orderId: string;
  notation: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export type BackendPaginated<T> = Paginated<T>;
