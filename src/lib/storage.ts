import { Product, Category } from '@/types/product';

const PRODUCTS_KEY = 'lixin-shop-products';
const CATEGORIES_KEY = 'lixin-shop-categories';
const STORAGE_VERSION_KEY = 'lixin-shop-version';
const CURRENT_VERSION = '1.0.0';

// 生成唯一ID的函数
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 数据备份和恢复接口
export interface BackupData {
  version: string;
  timestamp: string;
  products: Product[];
  categories: Category[];
}

// 存储管理基类
class BaseStorage {
  // 检查存储版本并进行数据迁移
  static checkStorageVersion(): void {
    if (typeof window === 'undefined') return;
    
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (!storedVersion) {
      // 首次使用，设置版本号
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
    } else if (storedVersion !== CURRENT_VERSION) {
      // 版本不匹配，可能需要数据迁移
      console.log(`存储版本从 ${storedVersion} 升级到 ${CURRENT_VERSION}`);
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
    }
  }

  // 导出所有数据
  static exportData(): BackupData {
    return {
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      products: ProductStorage.getProducts(),
      categories: CategoryStorage.getCategories(),
    };
  }

  // 导入数据
  static importData(data: BackupData): boolean {
    try {
      if (!data.version || !data.products || !data.categories) {
        throw new Error('数据格式不正确');
      }

      // 清空现有数据
      ProductStorage.clearAll();
      CategoryStorage.clearAll();

      // 导入分类
      data.categories.forEach(category => {
        CategoryStorage.addCategory({
          name: category.name,
          description: category.description,
        });
      });

      // 导入商品
      data.products.forEach(product => {
        ProductStorage.addProduct({
          name: product.name,
          description: product.description,
          price: product.price,
          gtin: product.gtin,
          category: product.category,
          categoryId: product.categoryId,
          stock: product.stock,
          imageUrl: product.imageUrl,
        });
      });

      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }

  // 清空所有数据
  static clearAllData(): void {
    ProductStorage.clearAll();
    CategoryStorage.clearAll();
  }
}

// 商品存储管理
export class ProductStorage {
  static getProducts(): Product[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  static addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: generateUniqueId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  static updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveProducts(products);
    return products[index];
  }

  static deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    if (filteredProducts.length === products.length) return false;
    
    this.saveProducts(filteredProducts);
    return true;
  }

  static getProductByGTIN(gtin: string): Product | null {
    const products = this.getProducts();
    return products.find(p => p.gtin === gtin) || null;
  }

  // 清空所有商品数据
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PRODUCTS_KEY);
  }

  // 获取商品统计信息
  static getStats() {
    const products = this.getProducts();
    return {
      total: products.length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      lowStock: products.filter(p => p.stock < 10).length,
      outOfStock: products.filter(p => p.stock === 0).length,
    };
  }
}

// 分类存储管理
export class CategoryStorage {
  static getCategories(): Category[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveCategories(categories: Category[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }

  static addCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category {
    const categories = this.getCategories();
    const newCategory: Category = {
      ...category,
      id: generateUniqueId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  }

  static updateCategory(id: string, updates: Partial<Category>): Category | null {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    categories[index] = {
      ...categories[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveCategories(categories);
    return categories[index];
  }

  static deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    const filteredCategories = categories.filter(c => c.id !== id);
    if (filteredCategories.length === categories.length) return false;
    
    this.saveCategories(filteredCategories);
    return true;
  }

  // 初始化默认分类
  static initializeDefaultCategories(): void {
    const categories = this.getCategories();
    if (categories.length === 0) {
      const defaultCategories = [
        { name: '食品饮料', description: '各类食品和饮料商品' },
        { name: '日用百货', description: '日常生活用品' },
        { name: '个人护理', description: '洗护用品和个人护理产品' },
        { name: '家居用品', description: '家庭日用品和装饰用品' },
        { name: '其他', description: '其他类别商品' },
      ];
      
      defaultCategories.forEach(category => {
        this.addCategory(category);
      });
    }
  }

  // 清空所有分类数据
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CATEGORIES_KEY);
  }

  // 获取分类统计信息
  static getStats() {
    const categories = this.getCategories();
    const products = ProductStorage.getProducts();
    
    return categories.map(category => ({
      ...category,
      productCount: products.filter(p => p.categoryId === category.id).length,
    }));
  }
}

// 初始化存储系统
export function initializeStorage(): void {
  BaseStorage.checkStorageVersion();
  CategoryStorage.initializeDefaultCategories();
}

// 导出存储管理基类
export { BaseStorage };