import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CategoryFormData } from '@/types/product';

// PUT - 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data: CategoryFormData = await request.json();
    const { id } = await params;
    
    // 检查分类是否存在
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });
    
    if (!existingCategory) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 });
    }
    
    // 检查名称是否与其他分类重复
    const duplicateCategory = await prisma.category.findFirst({
      where: { 
        name: data.name,
        id: { not: id }
      }
    });
    
    if (duplicateCategory) {
      return NextResponse.json({ error: '分类名称已存在' }, { status: 400 });
    }
    
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null
      }
    });
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('更新分类失败:', error);
    return NextResponse.json({ error: '更新分类失败' }, { status: 500 });
  }
}

// DELETE - 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 检查是否有商品使用此分类
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });
    
    if (productsCount > 0) {
      return NextResponse.json({ 
        error: `无法删除分类，还有 ${productsCount} 个商品使用此分类` 
      }, { status: 400 });
    }
    
    await prisma.category.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 });
  }
}