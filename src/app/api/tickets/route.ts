import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lấy danh sách tickets với phân trang và filter
 * @param request - Request object chứa query parameters
 * @returns Response với danh sách tickets
 */
// Thêm interface ở đầu file
// Cập nhật interface TicketWhereClause
interface TicketWhereClause {
  createDate?: {
    gte: Date;
    lte: Date;
  };
  category?: any; // Thay đổi từ string thành any để hỗ trợ JSON queries
  owner?: string;
  OR?: Array<{
    subject?: { contains: string; mode: 'insensitive' };
    content?: { contains: string; mode: 'insensitive' };
    company?: { contains: string; mode: 'insensitive' };
  }>;
}

// Thêm validation functions
function validatePagination(page: string, limit: string) {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) throw new Error('Invalid page number');
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) throw new Error('Invalid limit');
  
  return { page: pageNum, limit: limitNum };
}

function validateDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (start >= end) {
    throw new Error('Start date must be before end date');
  }
  
  return { start, end };
}

// Sử dụng trong GET method:
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = validatePagination(
      searchParams.get('page') || '1',
      searchParams.get('limit') || '10'
    );
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const owner = searchParams.get('owner');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Xây dựng where clause
    const where: TicketWhereClause = {};
    
    if (startDate && endDate) {
      where.createDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    // Cập nhật filter cho category để hỗ trợ JSON
    if (category && category !== 'all') {
      // Tìm kiếm trong JSON array values
      where.category = {
        path: ['values'],
        array_contains: category
      };
    }
    
    if (owner) {
      where.owner = owner;
    }
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Lấy tickets và tổng số
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createDate: 'desc' }
      }),
      prisma.ticket.count({ where })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Lỗi lấy danh sách tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi lấy danh sách tickets' },
      { status: 500 }
    );
  }
}

/**
 * Tạo ticket mới với category JSON format
 */
export async function POST(request: NextRequest) {
  try {
    const ticketData = await request.json();
    
    // Xử lý category data - chuyển đổi từ string array thành JSON format
    if (ticketData.categories && Array.isArray(ticketData.categories)) {
      ticketData.category = {
        values: ticketData.categories,
        primary: ticketData.categories[0] || null,
        count: ticketData.categories.length
      };
      delete ticketData.categories; // Xóa field cũ
    }
    
    const newTicket = await prisma.ticket.create({
      data: {
        ...ticketData,
        createDate: new Date(ticketData.createDate || Date.now())
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Ticket đã được tạo thành công',
      data: newTicket
    });
    
  } catch (error) {
    console.error('Lỗi tạo ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi tạo ticket mới' },
      { status: 500 }
    );
  }
}