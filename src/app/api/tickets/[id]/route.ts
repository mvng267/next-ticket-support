import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lấy chi tiết ticket theo ID
 * @param request - Request object
 * @param context - Context object chứa params
 * @returns Response với chi tiết ticket
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id }
    });
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy ticket' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: ticket
    });
    
  } catch (error) {
    console.error('Lỗi lấy chi tiết ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi lấy chi tiết ticket' },
      { status: 500 }
    );
  }
}

/**
 * Cập nhật ticket
 * @param request - Request object chứa dữ liệu cập nhật
 * @param context - Context object chứa params
 * @returns Response với ticket đã cập nhật
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const updateData = await request.json();
    
    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      message: 'Ticket đã được cập nhật',
      data: updatedTicket
    });
    
  } catch (error) {
    console.error('Lỗi cập nhật ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật ticket' },
      { status: 500 }
    );
  }
}

/**
 * Xóa ticket
 * @param request - Request object
 * @param context - Context object chứa params
 * @returns Response xác nhận xóa
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await prisma.ticket.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Ticket đã được xóa'
    });
    
  } catch (error) {
    console.error('Lỗi xóa ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi xóa ticket' },
      { status: 500 }
    );
  }
}