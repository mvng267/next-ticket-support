import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lấy prompt theo type
 * @param request - Request object
 * @param context - Context object chứa params
 * @returns Response với prompt
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const params = await context.params;
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.type }
    });
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy prompt' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: prompt
    });
    
  } catch (error) {
    console.error('Lỗi lấy prompt:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi lấy prompt' },
      { status: 500 }
    );
  }
}

/**
 * Cập nhật prompt
 * @param request - Request object chứa prompt data
 * @param context - Context object chứa params
 * @returns Response với prompt đã cập nhật
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const params = await context.params;
    const { prompt } = await request.json();
    
    const updatedPrompt = await prisma.prompt.upsert({
      where: { id: params.type },
      update: { prompt },
      create: {
        id: params.type,
        prompt
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Prompt đã được cập nhật',
      data: updatedPrompt
    });
    
  } catch (error) {
    console.error('Lỗi cập nhật prompt:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật prompt' },
      { status: 500 }
    );
  }
}