export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  children: CategoryNode[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFlat {
  id: string;
  name: string;
  slug: string;
  level: number;
  isActive: boolean;
  parentId: string | null;
}

export interface CreateCategoryPayload {
  name: string;
  parentId?: string | null;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
