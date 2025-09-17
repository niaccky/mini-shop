export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  gtin: string; // Global Trade Item Number - 商品唯一标识
  category: string;
  categoryId: string;
  stock: number;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  description?: string;
  gtin: string;
  categoryId: string;
  price: number;
  stock: number;
  imageUrl?: string;
  imageFile?: File;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}