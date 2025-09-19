'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types/product';
import { productApi, categoryApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Search, Filter, ShoppingCart, Package, Star, Grid, List, Heart, Eye, TrendingUp, Sparkles, ArrowRight, Plus, ChevronDown, Check } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 全新头部导航 */}
      <header className="relative bg-white/90 backdrop-blur-xl shadow-2xl border-b border-white/30 sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    立信超市
                  </h1>
                  <p className="text-sm text-gray-600 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    优质商品，贴心服务
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-medium">今日特惠</span>
              </div>
              <Link
                href="/admin"
                className="group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <span>管理后台</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 全新搜索和筛选区域 */}
        <div className="relative bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/30 mb-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 flex-1">
                {/* 增强搜索框 */}
                <div className="relative flex-1 max-w-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-sm"></div>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="搜索您想要的商品..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 border-0 bg-white/90 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:bg-white shadow-lg transition-all duration-300 placeholder-gray-400 text-gray-700 font-medium"
                    />
                    {searchTerm && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 分类筛选 */}
                <div className="relative">
                  <Select.Root value={selectedCategory} onValueChange={setSelectedCategory}>
                    <Select.Trigger className="group flex items-center space-x-4 bg-white/90 hover:bg-white rounded-2xl px-6 py-4 shadow-lg hover:shadow-xl border border-white/50 hover:border-blue-200/50 transition-all duration-300 cursor-pointer min-w-[180px]">
                      <Filter className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-300" />
                      <Select.Value className="text-gray-700 font-semibold group-hover:text-gray-900 transition-colors duration-300">
                        {selectedCategory === 'all' ? '全部分类' : categories.find(cat => cat.id === selectedCategory)?.name || '全部分类'}
                      </Select.Value>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-data-[state=open]:rotate-180 transition-all duration-300 ml-auto" />
                    </Select.Trigger>
                    
                    <Select.Portal>
                      <Select.Content className="relative z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-2 min-w-[180px] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                        <Select.Viewport>
                          <Select.Item 
                            value="all" 
                            className="group relative flex items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-all duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500 data-[state=checked]:text-white"
                          >
                            <Select.ItemText>全部分类</Select.ItemText>
                            <Select.ItemIndicator className="absolute right-3">
                              <Check className="w-4 h-4" />
                            </Select.ItemIndicator>
                          </Select.Item>
                          
                          {categories.map((category) => (
                            <Select.Item 
                              key={category.id} 
                              value={category.id}
                              className="group relative flex items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-all duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500 data-[state=checked]:text-white"
                            >
                              <Select.ItemText>{category.name}</Select.ItemText>
                              <Select.ItemIndicator className="absolute right-3">
                                <Check className="w-4 h-4" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              </div>

              {/* 排序和视图控制 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Select.Root 
                  value={`${sortBy}-${sortOrder}`} 
                  onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortBy(field as 'name' | 'price' | 'category');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                >
                  <Select.Trigger className="group flex items-center space-x-4 bg-white/90 hover:bg-white rounded-2xl px-6 py-4 shadow-lg hover:shadow-xl border border-white/50 hover:border-blue-200/50 transition-all duration-300 cursor-pointer min-w-[160px]">
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 font-semibold transition-colors duration-300">排序</span>
                    <Select.Value className="text-gray-700 font-semibold group-hover:text-gray-900 transition-colors duration-300" />
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-data-[state=open]:rotate-180 transition-all duration-300 ml-auto" />
                  </Select.Trigger>
                  
                  <Select.Portal>
                    <Select.Content className="relative z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-2 min-w-[160px] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                      <Select.Viewport>
                        <Select.Item 
                          value="name-asc" 
                          className="group relative flex items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-all duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500 data-[state=checked]:text-white"
                        >
                          <Select.ItemText>名称 A-Z</Select.ItemText>
                          <Select.ItemIndicator className="absolute right-3">
                            <Check className="w-4 h-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                        
                        <Select.Item 
                          value="name-desc" 
                          className="group relative flex items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-all duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500 data-[state=checked]:text-white"
                        >
                          <Select.ItemText>名称 Z-A</Select.ItemText>
                          <Select.ItemIndicator className="absolute right-3">
                            <Check className="w-4 h-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                        
                        <Select.Item 
                          value="price-asc" 
                          className="group relative flex items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-all duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500 data-[state=checked]:text-white"
                        >
                          <Select.ItemText>价格低到高</Select.ItemText>
                          <Select.ItemIndicator className="absolute right-3">
                            <Check className="w-4 h-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                        
                        <Select.Item 
                          value="price-desc" 
                          className="group relative flex items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-all duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500 data-[state=checked]:text-white"
                        >
                          <Select.ItemText>价格高到低</Select.ItemText>
                          <Select.ItemIndicator className="absolute right-3">
                            <Check className="w-4 h-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                        
                        <Select.Item 
                          value="category-asc" 
                          className="group relative flex items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-all duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500 data-[state=checked]:text-white"
                        >
                          <Select.ItemText>分类 A-Z</Select.ItemText>
                          <Select.ItemIndicator className="absolute right-3">
                            <Check className="w-4 h-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>

                <div className="flex items-center bg-white/90 rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-4 transition-all duration-300 ${
                      viewMode === 'grid' 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-4 transition-all duration-300 ${
                      viewMode === 'list' 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 商品展示区域 */}
        {isLoading ? (
          <div className="text-center py-24">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl shadow-2xl animate-pulse"></div>
              <Package className="relative w-10 h-10 text-white animate-bounce" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">正在加载精选商品</h3>
            <p className="text-gray-600">请稍候，为您呈现最优质的商品</p>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-3xl shadow-xl mb-8">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">暂无商品</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || selectedCategory ? '没有找到匹配的商品，试试调整搜索条件' : '还没有添加任何商品'}
            </p>
            {!searchTerm && !selectedCategory && (
              <Link
                href="/admin"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                前往管理后台添加商品
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* 商品数量显示 */}
            <div className="mb-10">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl px-8 py-6 shadow-xl border border-white/30">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 font-medium">
                    共找到 <span className="font-black text-blue-600 text-2xl mx-1">{filteredAndSortedProducts.length}</span> 个精选商品
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span>实时更新</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 网格视图 */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredAndSortedProducts.map((product) => (
                  <EnhancedProductCard 
                    key={product.id} 
                    product={product} 
                    isFavorite={favorites.has(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                  />
                ))}
              </div>
            )}

            {/* 列表视图 */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                {filteredAndSortedProducts.map((product) => (
                  <EnhancedProductListItem 
                    key={product.id} 
                    product={product}
                    isFavorite={favorites.has(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 全新增强商品卡片组件
function EnhancedProductCard({ 
  product, 
  isFavorite, 
  onToggleFavorite 
}: { 
  product: Product; 
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] overflow-hidden">
      {/* 商品图片区域 */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-3xl bg-gradient-to-br from-gray-50 to-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-white">
            <div className="p-6 bg-white/80 rounded-2xl shadow-lg">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          </div>
        )}
        
        {/* 悬浮操作按钮 */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={onToggleFavorite}
            className={`p-3 rounded-2xl shadow-lg backdrop-blur-md transition-all duration-300 ${
              isFavorite 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button className="p-3 bg-white/90 rounded-2xl shadow-lg backdrop-blur-md text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all duration-300">
            <Eye className="w-4 h-4" />
          </button>
        </div>
        
        {/* 分类标签 */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-xl backdrop-blur-md">
            {product.category}
          </span>
        </div>

        {/* 库存状态指示器 */}
        <div className="absolute bottom-4 left-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
            product.stock > 10 
              ? 'bg-green-500/90 text-white' 
              : product.stock > 0 
                ? 'bg-yellow-500/90 text-white' 
                : 'bg-red-500/90 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              product.stock > 10 ? 'bg-green-200' : product.stock > 0 ? 'bg-yellow-200' : 'bg-red-200'
            }`}></div>
            <span>库存 {product.stock}</span>
          </div>
        </div>
      </div>
      
      {/* 商品信息区域 */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
            {product.name}
          </h3>
        </div>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        
        {/* 价格展示 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <div className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {formatPrice(product.price)}
            </div>
            <div className="text-xs text-gray-400 font-medium">含税价格</div>
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
            ))}
          </div>
        </div>
        
        {/* GTIN信息 */}
        <div className="text-xs text-gray-400 font-mono mb-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
          <span className="text-gray-500 font-semibold">GTIN:</span> {product.gtin}
        </div>
        
        {/* 购买按钮 */}
        <button
          className={`w-full py-4 px-6 rounded-2xl text-sm font-bold transition-all duration-300 transform ${
            product.stock > 0
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? (
            <div className="flex items-center justify-center space-x-3">
              <ShoppingCart className="w-5 h-5" />
              <span>立即购买</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Package className="w-4 h-4" />
              <span>暂时缺货</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

// 全新增强商品列表项组件
function EnhancedProductListItem({ 
  product, 
  isFavorite, 
  onToggleFavorite 
}: { 
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-indigo-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
        {/* 商品图片 */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <div className="relative">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-48 w-full lg:h-32 lg:w-32 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500 shadow-lg"
              />
            ) : (
              <div className="h-48 w-full lg:h-32 lg:w-32 bg-gradient-to-br from-gray-100 via-gray-50 to-white rounded-2xl flex items-center justify-center shadow-lg">
                <div className="p-4 bg-white/80 rounded-xl shadow-md">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            )}
            
            {/* 分类标签 */}
            <div className="absolute -top-2 -right-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
                {product.category}
              </span>
            </div>
          </div>
        </div>
        
        {/* 商品信息 */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 lg:pr-8">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                  {product.name}
                </h3>
                <button
                  onClick={onToggleFavorite}
                  className={`ml-4 p-2 rounded-xl transition-all duration-300 ${
                    isFavorite 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              {product.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xs text-gray-400 font-mono px-3 py-1 bg-gray-50 rounded-lg">
                  GTIN: {product.gtin}
                </span>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  product.stock > 10 
                    ? 'bg-green-100 text-green-700' 
                    : product.stock > 0 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span>库存 {product.stock}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            
            {/* 价格和购买区域 */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start space-x-4 lg:space-x-0 lg:space-y-4">
              <div className="text-left lg:text-right">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {formatPrice(product.price)}
                </div>
                <div className="text-xs text-gray-400 font-medium">含税价格</div>
              </div>
              
              <button
                className={`py-4 px-8 rounded-2xl text-sm font-bold transition-all duration-300 transform whitespace-nowrap ${
                  product.stock > 0
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={product.stock === 0}
              >
                {product.stock > 0 ? (
                  <div className="flex items-center justify-center space-x-3">
                    <ShoppingCart className="w-5 h-5" />
                    <span>立即购买</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>暂时缺货</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
