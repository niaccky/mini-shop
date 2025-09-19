'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, ProductFormData, CategoryFormData } from '@/types/product';
import { productApi, categoryApi } from '@/lib/api';
import { validateGTIN, validateGTINDetailed, formatGTIN, formatPrice } from '@/lib/utils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Package, 
  Tag, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Save, 
  Download, 
  Upload, 
  Database,
  ArrowLeft,
  TrendingUp,
  Users,
  Settings,
  Eye
} from 'lucide-react';
import Link from 'next/link'

// 通知组件
const Notification = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`}>
    <div className="flex items-center gap-2">
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">×</button>
    </div>
  </div>
);

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDataManagement, setShowDataManagement] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productApi.getAll(),
        categoryApi.getAll()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('加载数据失败:', error);
      showNotification('加载数据失败', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 数据管理功能
  const handleExportData = async () => {
    try {
      const [products, categories] = await Promise.all([
        productApi.getAll(),
        categoryApi.getAll()
      ]);
      
      const backupData = {
        products,
        categories,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `lixin-shop-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('数据导出成功', 'success');
    } catch (error) {
      console.error('导出数据失败:', error);
      showNotification('导出数据失败', 'error');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // 验证数据格式
      if (!backupData.products || !backupData.categories) {
        throw new Error('无效的备份文件格式');
      }
      
      // 这里需要实现批量导入的API，暂时显示提示
      showNotification('导入功能需要后端支持批量操作', 'error');
    } catch (error) {
      console.error('导入数据失败:', error);
      showNotification('导入数据失败', 'error');
    }
  };

  const handleClearData = async () => {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) return;
    
    try {
      // 这里需要实现批量删除的API，暂时显示提示
      showNotification('清空数据功能需要后端支持批量操作', 'error');
    } catch (error) {
      console.error('清空数据失败:', error);
      showNotification('清空数据失败', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('确定要删除这个商品吗？')) return;
    
    try {
      await productApi.delete(id);
      setProducts(products.filter(p => p.id !== id));
      showNotification('商品删除成功', 'success');
    } catch (error) {
      console.error('删除商品失败:', error);
      showNotification('删除商品失败', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？关联的商品也会被删除！')) return;
    
    try {
      await categoryApi.delete(id);
      setCategories(categories.filter(c => c.id !== id));
      // 重新加载商品数据，因为关联商品可能被删除
      const updatedProducts = await productApi.getAll();
      setProducts(updatedProducts);
      showNotification('分类删除成功', 'success');
    } catch (error) {
      console.error('删除分类失败:', error);
      showNotification('删除分类失败', 'error');
    }
  };

  const handleProductSubmit = async (data: ProductFormData) => {
    try {
      let imageUrl = data.imageUrl;
      
      // 如果有新的图片文件，先上传图片
      if (data.imageFile) {
        const formData = new FormData();
        formData.append('file', data.imageFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('图片上传失败');
        }
        
        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.url;
      }

      const productData = {
        name: data.name,
        description: data.description,
        gtin: data.gtin,
        categoryId: data.categoryId,
        price: data.price,
        stock: data.stock,
        imageUrl: imageUrl || undefined,
      };

      if (editingProduct) {
        const updatedProduct = await productApi.update(editingProduct.id, productData);
        setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
        showNotification('商品更新成功', 'success');
      } else {
        const newProduct = await productApi.create(productData);
        setProducts([...products, newProduct]);
        showNotification('商品创建成功', 'success');
      }
      setEditingProduct(null);
      setShowProductForm(false);
    } catch (error) {
      console.error('保存商品失败:', error);
      showNotification(error instanceof Error ? error.message : '保存商品失败', 'error');
    }
  };

  const handleCategorySubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        const updatedCategory = await categoryApi.update(editingCategory.id, data);
        setCategories(categories.map(c => c.id === editingCategory.id ? updatedCategory : c));
        showNotification('分类更新成功', 'success');
      } else {
        const newCategory = await categoryApi.create(data);
        setCategories([...categories, newCategory]);
        showNotification('分类创建成功', 'success');
      }
      setEditingCategory(null);
      setShowCategoryForm(false);
    } catch (error) {
      console.error('保存分类失败:', error);
      showNotification(error instanceof Error ? error.message : '保存分类失败', 'error');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.gtin.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '未知分类';
  };

  // 统计数据
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const lowStockProducts = products.filter(p => p.stock <= 10).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 通知 */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* 顶部导航栏 */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors duration-200">返回商店</span>
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    管理控制台
                  </h1>
                  <p className="text-sm text-gray-500">商品与分类管理</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">{totalProducts} 商品</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl">
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700 font-medium">{totalCategories} 分类</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-medium">{formatPrice(totalValue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总商品数</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">分类数量</p>
                <p className="text-2xl font-bold text-gray-900">{totalCategories}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">低库存商品</p>
                <p className="text-2xl font-bold text-red-600">{lowStockProducts}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">库存总价值</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(totalValue)}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900">快速操作</h2>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowDataManagement(!showDataManagement)}
                className="group bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 flex items-center gap-3 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Database size={18} />
                <span>数据管理</span>
              </button>
              
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-3 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus size={18} />
                <span>添加商品</span>
              </button>
              
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryForm(true);
                }}
                className="group bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 flex items-center gap-3 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus size={18} />
                <span>添加分类</span>
              </button>
            </div>
          </div>
        </div>

        {/* 数据管理面板 */}
        {showDataManagement && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 mb-8 animate-in slide-in-from-top-5 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Database size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  数据管理
                </h2>
                <p className="text-sm text-gray-600">导入、导出和管理您的数据</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={handleExportData}
                className="group flex items-center gap-4 p-6 border-2 border-blue-200 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Download size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">导出数据</div>
                  <div className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-200">备份所有商品和分类数据</div>
                </div>
              </button>
              
              <label className="group flex items-center gap-4 p-6 border-2 border-green-200 rounded-2xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-300 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Upload size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-200">导入数据</div>
                  <div className="text-sm text-gray-600 group-hover:text-green-600 transition-colors duration-200">从备份文件恢复数据</div>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={handleClearData}
                className="group flex items-center gap-4 p-6 border-2 border-red-200 rounded-2xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:border-red-300 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Trash2 size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-red-700 group-hover:text-red-800 transition-colors duration-200">清空数据</div>
                  <div className="text-sm text-red-600 group-hover:text-red-700 transition-colors duration-200">删除所有商品和分类</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-blue-100 rounded-xl">
                <Search className="text-blue-600" size={18} />
              </div>
              <input
                type="text"
                placeholder="搜索商品名称或GTIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-4 border-0 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-base shadow-md placeholder-gray-500"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <Filter size={18} className="text-white" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-6 py-4 border-0 bg-white/80 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-base min-w-48 shadow-md font-medium"
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
        </div>

        {/* 商品列表 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-white/20 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    商品管理
                  </h2>
                  <p className="text-sm text-gray-600">共 {filteredProducts.length} 件商品</p>
                </div>
              </div>
              
              {lowStockProducts > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">{lowStockProducts} 件商品库存不足</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">商品</th>
                  <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">GTIN</th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">价格</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">库存</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200/50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/80 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-16 w-16">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-16 w-16 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-200"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md">
                              <Package className="h-8 w-8 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-600 truncate mt-1">
                            {product.description}
                          </div>
                          <div className="lg:hidden text-xs text-gray-500 font-mono mt-2 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                            {product.gtin}
                          </div>
                          <div className="md:hidden text-xs text-blue-600 mt-2 bg-blue-50 px-3 py-1 rounded-lg inline-block font-medium">
                            {getCategoryName(product.categoryId)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                      <span className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                        {product.gtin}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {getCategoryName(product.categoryId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatPrice(product.price)}
                      </div>
                      <div className="sm:hidden text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-1 rounded-md inline-block">
                        库存: {product.stock}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        product.stock > 10 
                          ? 'bg-green-100 text-green-800' 
                          : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductForm(true);
                          }}
                          className="p-3 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                          title="编辑商品"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-3 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                          title="删除商品"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分类管理 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/20 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Tag size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  分类管理
                </h2>
                <p className="text-sm text-gray-600">共 {categories.length} 个分类</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {categories.map((category) => (
              <div key={category.id} className="group bg-white/90 backdrop-blur-md border-2 border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:border-purple-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-gray-900 text-lg truncate pr-2 group-hover:text-purple-600 transition-colors duration-200">
                    {category.name}
                  </h3>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryForm(true);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                      title="编辑分类"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                      title="删除分类"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4 line-clamp-3 leading-relaxed">
                  {category.description}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg font-medium">
                    商品数量: <span className="text-purple-600 font-bold">{products.filter(p => p.categoryId === category.id).length}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye size={14} />
                    <span>查看详情</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 商品表单模态框 */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSubmit={handleProductSubmit}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* 分类表单模态框 */}
      {showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          onSubmit={handleCategorySubmit}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

// 商品表单组件
function ProductForm({ 
  product, 
  categories, 
  onSubmit, 
  onClose 
}: { 
  product: Product | null;
  categories: Category[];
  onSubmit: (data: ProductFormData) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    stock: product?.stock || 0,
    gtin: product?.gtin || '',
    categoryId: product?.categoryId || (categories.length > 0 ? categories[0].id : ''),
    imageUrl: product?.imageUrl || '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData({ ...formData, imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {product ? '编辑商品' : '添加商品'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品名称
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GTIN编码
            </label>
            <input
              type="text"
              required
              value={formData.gtin}
              onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入13位GTIN编码"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">选择分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                价格 (元)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                库存
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品图片 (可选)
            </label>
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="商品预览"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload size={16} />
                  {imagePreview ? '更换图片' : '选择图片'}
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {product ? '更新' : '添加'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 分类表单组件
function CategoryForm({ 
  category, 
  onSubmit, 
  onClose 
}: { 
  category: Category | null;
  onSubmit: (data: CategoryFormData) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {category ? '编辑分类' : '添加分类'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类名称
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {category ? '更新' : '添加'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}