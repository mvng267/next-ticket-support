import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lấy tất cả prompts
 * @param request - Request object
 * @returns Response với danh sách prompts
 */
export async function GET(request: NextRequest) {
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: { id: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      data: prompts
    });
    
  } catch (error) {
    console.error('Lỗi lấy danh sách prompts:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi lấy danh sách prompts' },
      { status: 500 }
    );
  }
}

/**
 * Tạo prompt mới hoặc cập nhật nhiều prompts
 * @param request - Request object chứa prompts data
 * @returns Response với kết quả
 */
export async function POST(request: NextRequest) {
  try {
    const { prompts } = await request.json();
    
    // Sử dụng transaction để cập nhật nhiều prompts
    const result = await prisma.$transaction(
      prompts.map((prompt: { id: string; prompt: string }) =>
        prisma.prompt.upsert({
          where: { id: prompt.id },
          update: { prompt: prompt.prompt },
          create: {
            id: prompt.id,
            prompt: prompt.prompt
          }
        })
      )
    );
    
    return NextResponse.json({
      success: true,
      message: 'Prompts đã được cập nhật',
      data: result
    });
    
  } catch (error) {
    console.error('Lỗi cập nhật prompts:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật prompts' },
      { status: 500 }
    );
  }
}