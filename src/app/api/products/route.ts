import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProductFormData } from '@/types/product';

// GET - 获取所有商品
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        categoryRef: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // 转换数据格式以匹配前端期望的结构
    const formattedProducts = products.map(product => ({
      ...product,
      category: product.categoryRef.name
    }));
    
    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('获取商品失败:', error);
    return NextResponse.json({ error: '获取商品失败' }, { status: 500 });
  }
}

// POST - 创建新商品
export async function POST(request: NextRequest) {
  try {
    const data: ProductFormData = await request.json();
    
    // 检查GTIN是否已存在
    const existingProduct = await prisma.product.findFirst({
      where: { gtin: data.gtin }
    });
    
    if (existingProduct) {
      return NextResponse.json({ error: 'GTIN编码已存在' }, { status: 400 });
    }
    
    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });
    
    if (!category) {
      return NextResponse.json({ error: '所选分类不存在' }, { status: 400 });
    }
    
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || '',
        gtin: data.gtin,
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl || null,
        category: category.name,
        categoryId: data.categoryId
      },
      include: {
        categoryRef: true
      }
    });
    
    // 转换数据格式
    const formattedProduct = {
      ...product,
      category: product.categoryRef.name
    };
    
    return NextResponse.json(formattedProduct, { status: 201 });
  } catch (error) {
    console.error('创建商品失败:', error);
    return NextResponse.json({ error: '创建商品失败' }, { status: 500 });
  }
}