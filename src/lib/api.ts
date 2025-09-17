import { Product, Category } from '@/types/product';

// 分类相关API
export const categoryApi = {
  // 获取所有分类
  async getAll(): Promise<Category[]> {
    const response = await fetch('/api/categories');
    if (!response.ok) {
      throw new Error('获取分类失败');
    }
    return response.json();
  },

  // 创建分类
  async create(data: { name: string; description?: string }): Promise<Category> {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建分类失败');
    }
    return response.json();
  },

  // 更新分类
  async update(id: string, data: { name: string; description?: string }): Promise<Category> {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新分类失败');
    }
    return response.json();
  },

  // 删除分类
  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '删除分类失败');
    }
  },
};

// 商品相关API
export const productApi = {
  // 获取所有商品
  async getAll(): Promise<Product[]> {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error('获取商品失败');
    }
    return response.json();
  },

  // 创建商品
  async create(data: {
    name: string;
    description?: string;
    gtin: string;
    price: number;
    stock: number;
    imageUrl?: string;
    categoryId: string;
  }): Promise<Product> {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建商品失败');
    }
    return response.json();
  },

  // 更新商品
  async update(id: string, data: {
    name: string;
    description?: string;
    gtin: string;
    price: number;
    stock: number;
    imageUrl?: string;
    categoryId: string;
  }): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新商品失败');
    }
    return response.json();
  },

  // 删除商品
  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '删除商品失败');
    }
  },
};