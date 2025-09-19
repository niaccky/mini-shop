import { prisma } from './prisma';
import { Product, Category, ProductFormData, CategoryFormData } from '@/types/product';

// 分类相关操作
export class CategoryDatabase {
  static async getCategories(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return categories;
  }

  static async addCategory(data: CategoryFormData): Promise<Category> {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return category;
  }

  static async updateCategory(id: string, updates: Partial<CategoryFormData>): Promise<Category | null> {
    try {
      const category = await prisma.category.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
      return category;
    } catch (error) {
      console.error('更新分类失败:', error);
      return null;
    }
  }

  static async deleteCategory(id: string): Promise<boolean> {
    try {
      await prisma.category.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('删除分类失败:', error);
      return false;
    }
  }

  static async initializeDefaultCategories(): Promise<void> {
    const existingCategories = await prisma.category.count();
    if (existingCategories === 0) {
      const defaultCategories = [
        { name: '电子产品', description: '手机、电脑、数码设备等' },
        { name: '服装鞋帽', description: '男装、女装、童装、鞋类等' },
        { name: '家居用品', description: '家具、装饰、日用品等' },
        { name: '食品饮料', description: '零食、饮品、生鲜等' },
        { name: '图书文具', description: '书籍、文具、办公用品等' },
      ];

      await prisma.category.createMany({
        data: defaultCategories,
      });
    }
  }

  static async getStats() {
    const total = await prisma.category.count();
    const withProducts = await prisma.category.count({
      where: {
        products: {
          some: {},
        },
      },
    });
    return {
      total,
      withProducts,
      empty: total - withProducts,
    };
  }
}

// 商品相关操作
export class ProductDatabase {
  static async getProducts(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      include: {
        categoryRef: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return products;
  }

  static async addProduct(data: ProductFormData): Promise<Product> {
    // 获取分类信息
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || '',
        price: data.price,
        gtin: data.gtin,
        category: category.name,
        categoryId: data.categoryId,
        stock: data.stock,
        imageUrl: data.imageUrl || null,
      },
      include: {
        categoryRef: true,
      },
    });
    return product;
  }

  static async updateProduct(id: string, updates: Partial<ProductFormData>): Promise<Product | null> {
    try {
      const updateData: Partial<ProductFormData> & { updatedAt: Date; category?: string } = {
        ...updates,
        updatedAt: new Date(),
      };

      // 如果更新了分类ID，需要同时更新分类名称
      if (updates.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: updates.categoryId },
        });
        if (category) {
          updateData.category = category.name;
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          categoryRef: true,
        },
      });
      return product;
    } catch (error) {
      console.error('更新商品失败:', error);
      return null;
    }
  }

  static async deleteProduct(id: string): Promise<boolean> {
    try {
      await prisma.product.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('删除商品失败:', error);
      return false;
    }
  }

  static async getProductByGTIN(gtin: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { gtin },
      include: {
        categoryRef: true,
      },
    });
    return product;
  }

  static async getStats() {
    const total = await prisma.product.count();
    const lowStock = await prisma.product.count({
      where: {
        stock: {
          lte: 10,
        },
      },
    });
    const outOfStock = await prisma.product.count({
      where: {
        stock: 0,
      },
    });
    const totalValue = await prisma.product.aggregate({
      _sum: {
        price: true,
      },
    });

    return {
      total,
      lowStock,
      outOfStock,
      totalValue: totalValue._sum.price || 0,
    };
  }
}

// 数据迁移和备份
export interface BackupData {
  version: string;
  timestamp: string;
  products: Product[];
  categories: Category[];
}

export class DatabaseManager {
  static async exportData(): Promise<BackupData> {
    const products = await ProductDatabase.getProducts();
    const categories = await CategoryDatabase.getCategories();
    
    return {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      products,
      categories,
    };
  }

  static async importData(data: BackupData): Promise<boolean> {
    try {
      if (!data.version || !data.products || !data.categories) {
        throw new Error('数据格式不正确');
      }

      // 清空现有数据
      await prisma.product.deleteMany();
      await prisma.category.deleteMany();

      // 导入分类
      for (const category of data.categories) {
        await prisma.category.create({
          data: {
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
          },
        });
      }

      // 导入商品
      for (const product of data.products) {
        await prisma.product.create({
          data: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            gtin: product.gtin,
            category: product.category,
            categoryId: product.categoryId,
            stock: product.stock,
            imageUrl: product.imageUrl,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }

  static async clearAllData(): Promise<void> {
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  }

  static async initializeDatabase(): Promise<void> {
    await CategoryDatabase.initializeDefaultCategories();
  }
}