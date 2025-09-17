import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProductFormData } from '@/types/product';

// PUT - 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data: ProductFormData = await request.json();
    const { id } = await params;
    
    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }
    
    // 检查GTIN是否与其他商品重复
    const duplicateProduct = await prisma.product.findFirst({
      where: { 
        gtin: data.gtin,
        id: { not: id }
      }
    });
    
    if (duplicateProduct) {
      return NextResponse.json({ error: 'GTIN编码已存在' }, { status: 400 });
    }
    
    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });
    
    if (!category) {
      return NextResponse.json({ error: '所选分类不存在' }, { status: 400 });
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id },
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
      ...updatedProduct,
      category: updatedProduct.categoryRef.name
    };
    
    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('更新商品失败:', error);
    return NextResponse.json({ error: '更新商品失败' }, { status: 500 });
  }
}

// DELETE - 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }
    
    await prisma.product.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: '商品删除成功' });
  } catch (error) {
    console.error('删除商品失败:', error);
    return NextResponse.json({ error: '删除商品失败' }, { status: 500 });
  }
}