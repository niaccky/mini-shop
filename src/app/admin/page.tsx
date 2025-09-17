'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, ProductFormData, CategoryFormData } from '@/types/product';
import { productApi, categoryApi } from '@/lib/api';
import { validateGTIN, validateGTINDetailed, formatGTIN, formatPrice } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, Filter, Package, Tag, AlertCircle, CheckCircle, X, Save, Download, Upload, Database } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 通知 */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* 头部操作栏 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">商品管理</h1>
                <p className="text-sm text-gray-600 mt-1">管理您的商品库存和分类</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowDataManagement(!showDataManagement)}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2.5 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Database size={16} className="sm:w-5 sm:h-5" />
                数据管理
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus size={16} className="sm:w-5 sm:h-5" />
                添加商品
              </button>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryForm(true);
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus size={16} className="sm:w-5 sm:h-5" />
                添加分类
              </button>
            </div>
          </div>
        </div>

        {/* 数据管理面板 */}
        {showDataManagement && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Database size={20} className="text-white sm:w-6 sm:h-6" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">数据管理</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <button
                onClick={handleExportData}
                className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 border border-white/30 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Download size={18} className="text-white sm:w-5 sm:h-5 flex-shrink-0" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-blue-700 transition-colors duration-200">导出数据</div>
                  <div className="text-xs sm:text-sm text-gray-500 group-hover:text-blue-600 transition-colors duration-200">备份所有商品和分类数据</div>
                </div>
              </button>
              
              <label className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 border border-white/30 rounded-2xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Upload size={18} className="text-white sm:w-5 sm:h-5 flex-shrink-0" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-green-700 transition-colors duration-200">导入数据</div>
                  <div className="text-xs sm:text-sm text-gray-500 group-hover:text-green-600 transition-colors duration-200">从备份文件恢复数据</div>
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
                className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 border border-red-200 rounded-2xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg text-red-600 sm:col-span-2 lg:col-span-1"
              >
                <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Trash2 size={18} className="text-white sm:w-5 sm:h-5 flex-shrink-0" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm sm:text-base text-red-700 group-hover:text-red-800 transition-colors duration-200">清空数据</div>
                  <div className="text-xs sm:text-sm text-red-500 group-hover:text-red-600 transition-colors duration-200">删除所有商品和分类</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 bg-blue-100 rounded-lg">
                <Search className="text-blue-600" size={16} />
              </div>
              <input
                type="text"
                placeholder="搜索商品名称或GTIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-0 bg-white/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm sm:text-base shadow-md"
              />
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <Filter size={16} className="text-white sm:w-5 sm:h-5" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border-0 bg-white/80 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm sm:text-base min-w-0 flex-1 sm:flex-none shadow-md font-medium"
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
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/20 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <Package size={20} className="text-white sm:w-6 sm:h-6" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                商品管理 ({filteredProducts.length})
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">图片</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">商品信息</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">GTIN</th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">分类</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">价格</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">库存</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200/50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/80 transition-colors duration-200">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200"
                          />
                        ) : (
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md">
                            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-32 sm:max-w-none">{product.name}</div>
                        <div className="text-xs text-gray-600 truncate max-w-32 sm:max-w-none sm:whitespace-nowrap">{product.description}</div>
                        <div className="sm:hidden text-xs text-gray-500 font-mono mt-1 bg-gray-100 px-2 py-1 rounded-md inline-block">{product.gtin}</div>
                        <div className="md:hidden text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded-md inline-block font-medium">{getCategoryName(product.categoryId)}</div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono bg-gray-50 rounded-lg mx-2">
                      {product.gtin}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      <span className="bg-blue-50 px-3 py-1 rounded-full text-xs">{getCategoryName(product.categoryId)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900 font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatPrice(product.price)}
                      </div>
                      <div className="sm:hidden text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-1 rounded-md inline-block">
                        库存: {product.stock}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        product.stock > 10 
                          ? 'bg-green-100 text-green-800' 
                          : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductForm(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                        >
                          <Edit size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                        >
                          <Trash2 size={14} className="sm:w-4 sm:h-4" />
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
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/20 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Tag size={20} className="text-white sm:w-6 sm:h-6" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                分类管理 ({categories.length})
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
            {categories.map((category) => (
              <div key={category.id} className="group bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate pr-2 group-hover:text-purple-600 transition-colors duration-200">{category.name}</h3>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryForm(true);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    >
                      <Edit size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 mb-3 line-clamp-2 leading-relaxed">{category.description}</p>
                <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg font-medium">
                  商品数量: <span className="text-purple-600 font-bold">{products.filter(p => p.categoryId === category.id).length}</span>
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