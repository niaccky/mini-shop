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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 头部导航 */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">立信超市</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">优质商品，贴心服务</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href="/admin"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                管理后台
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选栏 */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜索商品名称、描述或GTIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-0 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-md transition-all duration-200 placeholder-gray-400"
                />
              </div>

              {/* 分类筛选 */}
              <div className="flex items-center space-x-3 bg-white/80 rounded-xl px-4 py-3 shadow-md">
                <Filter className="w-5 h-5 text-blue-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border-0 bg-transparent focus:ring-0 focus:outline-none text-gray-700 font-medium"
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3 bg-white/80 rounded-xl px-4 py-3 shadow-md">
                <span className="text-sm text-gray-600 font-medium hidden sm:inline">排序:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as 'name' | 'price' | 'category');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="border-0 bg-transparent focus:ring-0 focus:outline-none text-gray-700 font-medium text-xs sm:text-sm"
                >
                  <option value="name-asc">名称 A-Z</option>
                  <option value="name-desc">名称 Z-A</option>
                  <option value="price-asc">价格低到高</option>
                  <option value="price-desc">价格高到低</option>
                  <option value="category-asc">分类 A-Z</option>
                </select>
              </div>

              <div className="flex items-center bg-white/80 rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-all duration-200 ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-all duration-200 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 商品展示区域 */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg mb-6">
              <Package className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">加载中...</h3>
            <p className="text-gray-500">正在获取商品数据</p>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl shadow-lg mb-6">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无商品</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory ? '没有找到匹配的商品' : '还没有添加任何商品'}
            </p>
            {!searchTerm && !selectedCategory && (
              <Link
                href="/admin"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                前往管理后台添加商品
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* 商品数量显示 */}
            <div className="mb-8">
              <div className="bg-white/70 backdrop-blur-md rounded-xl px-6 py-4 shadow-lg border border-white/20">
                <p className="text-sm text-gray-600">
                  共找到 <span className="font-bold text-blue-600 text-lg">{filteredAndSortedProducts.length}</span> 个商品
                </p>
              </div>
            </div>

            {/* 网格视图 */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* 列表视图 */}
            {viewMode === 'list' && (
              <div className="space-y-6">
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
    <div className="group bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-gray-50 to-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-48 sm:h-56 w-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="h-48 sm:h-56 w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="p-4 bg-white/80 rounded-xl shadow-md">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            </div>
          </div>
        )}
        {/* 分类标签 */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
            {product.category}
          </span>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">{product.name}</h3>
        </div>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {formatPrice(product.price)}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              product.stock > 10 ? 'bg-green-100 text-green-700' : 
              product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 
              'bg-red-100 text-red-700'
            }`}>
              库存: {product.stock}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 font-mono mb-4 p-2 bg-gray-50 rounded-lg">
          GTIN: {product.gtin}
        </div>
        
        <button
          className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 transform ${
            product.stock > 0
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105'
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
    <div className="group bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="flex-shrink-0 w-full sm:w-auto">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-40 w-full sm:h-24 sm:w-24 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-40 w-full sm:h-24 sm:w-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <div className="p-2 bg-white/80 rounded-lg shadow-md">
                <Package className="h-8 w-8 sm:h-6 sm:w-6 text-gray-400" />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">{product.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
                  {product.category}
                </span>
                <span className="text-xs text-gray-400 font-mono px-2 py-1 bg-gray-50 rounded-lg">
                  GTIN: {product.gtin}
                </span>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  product.stock > 10 ? 'bg-green-100 text-green-700' : 
                  product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  库存: {product.stock}
                </div>
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start space-x-4 sm:space-x-0 sm:space-y-3 sm:ml-6">
              <div className="text-left sm:text-right">
                <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {formatPrice(product.price)}
                </div>
              </div>
              
              <button
                className={`py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 transform whitespace-nowrap ${
                  product.stock > 0
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105'
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
        </div>
      </div>
    </div>
  );
}
