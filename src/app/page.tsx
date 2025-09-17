'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types/product';
import { productApi, categoryApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Search, Filter, ShoppingCart, Package, Star, Grid, List } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          productApi.getAll(),
          categoryApi.getAll()
        ]);
        
        console.log('加载的商品数据:', productsData);
        console.log('加载的分类数据:', categoriesData);
        
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 过滤和排序商品
  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.gtin.includes(searchTerm);
      const matchesCategory = selectedCategory === 'all' || !selectedCategory || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Package className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">立信超市</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                管理后台
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选栏 */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜索商品名称、描述或GTIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 分类筛选 */}
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">所有分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 排序和视图控制 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">排序:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as 'name' | 'price' | 'category');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name-asc">名称 A-Z</option>
                  <option value="name-desc">名称 Z-A</option>
                  <option value="price-asc">价格低到高</option>
                  <option value="price-desc">价格高到低</option>
                  <option value="category-asc">分类 A-Z</option>
                </select>
              </div>

              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 商品展示区域 */}
        {isLoading ? (
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-gray-400 animate-pulse" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">加载中...</h3>
            <p className="mt-2 text-gray-500">正在获取商品数据</p>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">暂无商品</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm || selectedCategory ? '没有找到匹配的商品' : '还没有添加任何商品'}
            </p>
            {!searchTerm && !selectedCategory && (
              <Link
                href="/admin"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                前往管理后台添加商品
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* 商品数量显示 */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                共找到 <span className="font-medium">{filteredAndSortedProducts.length}</span> 个商品
              </p>
            </div>

            {/* 网格视图 */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* 列表视图 */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredAndSortedProducts.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 商品卡片组件
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-48 w-full object-cover object-center"
          />
        ) : (
          <div className="h-48 w-full flex items-center justify-center bg-gray-100">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{product.name}</h3>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2 flex-shrink-0">
            {product.category}
          </span>
        </div>
        
        {product.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
        )}
        
        <div className="flex justify-between items-center mb-3">
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(product.price)}
          </div>
          <div className="text-sm text-gray-500">
            库存: {product.stock}
          </div>
        </div>
        
        <div className="text-xs text-gray-400 font-mono mb-3">
          GTIN: {product.gtin}
        </div>
        
        <button
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            product.stock > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? (
            <div className="flex items-center justify-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>加入购物车</span>
            </div>
          ) : (
            '暂时缺货'
          )}
        </button>
      </div>
    </div>
  );
}

// 商品列表项组件
function ProductListItem({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-6">
        <div className="flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-20 w-20 object-cover rounded-lg"
            />
          ) : (
            <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-gray-500 mt-1">{product.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {product.category}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  GTIN: {product.gtin}
                </span>
                <span className="text-sm text-gray-500">
                  库存: {product.stock}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 ml-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(product.price)}
                </div>
              </div>
              
              <button
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  product.stock > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={product.stock === 0}
              >
                {product.stock > 0 ? (
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>加入购物车</span>
                  </div>
                ) : (
                  '暂时缺货'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
