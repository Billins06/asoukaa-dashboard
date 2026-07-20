export type FournisseurCurrency = 'XOF' | 'NGN' | 'USD' | 'EUR' | 'GHS' | 'CNY';

export interface FournisseurListItem {
  id: string;
  four_name: string;
  contactPerson: string;
  four_email: string | null;
  four_phone: string;
  four_country: string;
  four_ville: string;
  currency: FournisseurCurrency;
  delaiLivraison: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateFournisseurPayload {
  four_name: string;
  contactPerson: string;
  four_phone: string;
  four_country: string;
  four_ville: string;
  currency: FournisseurCurrency;
  four_email?: string;
  delaiLivraison?: number;
  notes?: string;
  isActive?: boolean;
}

export type UpdateFournisseurPayload = Partial<CreateFournisseurPayload>;
