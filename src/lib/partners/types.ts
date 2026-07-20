export interface PartnerListItem {
  id: string;
  part_name: string;
  part_logoUrl: string | null;
  part_websiteUrl: string | null;
  description: string | null;
  isActive: boolean;
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

export interface CreatePartnerPayload {
  part_name: string;
  part_logoUrl?: string;
  part_websiteUrl?: string;
  description?: string;
  isActive?: boolean;
}

export type UpdatePartnerPayload = Partial<CreatePartnerPayload>;
