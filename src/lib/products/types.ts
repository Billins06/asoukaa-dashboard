export type ProductStatus = 'brouillon' | 'active' | 'inactive' | 'out_of_stock';

export interface AdminProductListItem {
  id: string;
  prod_name: string;
  slug: string;
  basePrice: number | string;
  status: ProductStatus;
  isDigital: boolean;
  isVedette: boolean;
  isBlockedByAdmin: boolean;
  adminBlockReason: string | null;
  adminBlockedAt: string | null;
  totalVentes: number;
  nombreVues: number;
  noteMoyenne: number | string;
  nbreAvis: number;
  author: string | null;
  createdAt: string;
  vendor: { id: string; shopName: string } | null;
  images?: { id: string; url: string }[];
}

export interface AdminProductDetail extends AdminProductListItem {
  description: string;
  pageCount: number | null;
  language: string | null;
  fileSizeBytes: number | null;
  vendor: { id: string; shopName: string; userId: string } | null;
  images: { id: string; url: string; isPrimary?: boolean; isVideo?: boolean; sortOrder?: number }[];
  variants: {
    id: string;
    sku: string;
    color: string | null;
    size: string | null;
    model: string | null;
    price: number | string;
    stockQuantity: number;
    isActive: boolean;
  }[];
  categories: { id: string; name: string }[];
}

export interface AdminProductsPage {
  data: AdminProductListItem[];
  total: number;
  page: number;
  pages: number;
}
