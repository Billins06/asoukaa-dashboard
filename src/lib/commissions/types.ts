export type CommissionStatus = 'PENDING' | 'PAID';

export interface CommissionVendor {
  id: string;
  shopName: string;
}

export interface CommissionOrder {
  id: string;
  orderNumber: string;
}

export interface CommissionListItem {
  id: string;
  orderId: string;
  order: CommissionOrder;
  vendorId: string;
  vendor: CommissionVendor;
  totalCommande: number;
  taux: number;
  montantCommission: number;
  commissionVendor: number;
  status: CommissionStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionStats {
  totalCommissions: number;
  totalPaid: number;
  totalPending: number;
  montantTotal: number;
  montantPaid: number;
  montantPending: number;
}

export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
