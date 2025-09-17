import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CategoryFormData } from '@/types/product';

// GET - 获取所有分类
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 });
  }
}

// POST - 创建新分类
export async function POST(request: NextRequest) {
  try {
    const data: CategoryFormData = await request.json();
    
    // 检查分类名称是否已存在
    const existingCategory = await prisma.category.findFirst({
      where: { name: data.name }
    });
    
    if (existingCategory) {
      return NextResponse.json({ error: '分类名称已存在' }, { status: 400 });
    }
    
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description || null
      }
    });
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('创建分类失败:', error);
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 });
  }
}