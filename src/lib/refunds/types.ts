export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

export interface RefundOrder {
  id: string;
  orderNumber: string;
}

export interface RefundListItem {
  id: string;
  paymentId: string;
  orderId: string;
  order: RefundOrder;
  montantRemb: number;
  motif: string;
  status: RefundStatus;
  dateDemande: string;
  processedAt: string | null;
  updatedAt: string;
}

export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
