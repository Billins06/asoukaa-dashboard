export type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';

export interface VendorUser {
  id: string;
  prenom: string;
  name: string;
  email: string;
  phone: string;
}

export interface VendorListItem {
  id: string;
  shopName: string;
  activityType: string;
  status: VendorStatus;
  submittedAt: string | null;
  submissionCount: number;
  user: VendorUser;
}

export interface VendorPendingItem {
  id: string;
  shopName: string;
  activityType: string;
  submittedAt: string | null;
  submissionCount: number;
  user: Pick<VendorUser, 'id' | 'prenom' | 'name' | 'email'>;
}

export type VendorReviewAction = 'approve' | 'reject';

export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
