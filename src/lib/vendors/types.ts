export type VendorStatus = 'en attente' | 'approuvé' | 'rejeté' | 'bloqué';

export interface VendorUser {
  id: string;
  prenom: string;
  name: string;
  email: string;
  phone: string;
}

export interface VendorCategory {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface VendorListItem {
  id: string;
  shopName: string;
  activityType: string;
  categoryIds?: string[];
  categories?: VendorCategory[];
  status: VendorStatus;
  submittedAt: string | null;
  submissionCount: number;
  user: VendorUser;
  // Pièces du dossier (renvoyées par la fiche /vendors/:id ; contrôlées avant affichage)
  idDocumentUrl?: string | null;
  selfieUrl?: string | null;
  sampleProductUrls?: string[] | null;
}

export interface VendorPendingItem {
  id: string;
  shopName: string;
  activityType: string;
  categoryIds?: string[];
  categories?: VendorCategory[];
  submittedAt: string | null;
  submissionCount: number;
  user: Pick<VendorUser, 'id' | 'prenom' | 'name' | 'email'>;
  idDocumentUrl?: string | null;
  selfieUrl?: string | null;
  sampleProductUrls?: string[] | null;
}

export type VendorReviewAction = 'approve' | 'reject';

export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
