export type OrderStatus = 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderVendor {
  id: string;
  shopName: string;
}

export interface OrderAddress {
  id: string;
  ville?: string;
  quartier?: string;
  adresseComplete?: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  fraisLivraison: number;
  montantCommission: number;
  motifAnnulation?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor: OrderVendor;
  address?: OrderAddress | null;
}

export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  motifAnnulation?: string;
}
