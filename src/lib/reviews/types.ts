export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReviewUser {
  id: string;
  prenom: string;
  name: string;
}

export interface ReviewProduct {
  id: string;
  name: string;
}

export interface ReviewListItem {
  id: string;
  userId: string;
  user: ReviewUser;
  productId: string;
  product: ReviewProduct;
  orderId: string;
  notation: number;
  comment: string | null;
  status: ReviewStatus;
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
