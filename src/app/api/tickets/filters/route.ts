import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface cho ticket type
interface Ticket {
  category: any;
  owner: string | null;
}

// Interface cho TicketWhereClause
interface TicketWhereClause {
  createDate?: {
    gte: Date;
    lte: Date;
  };
  category?: any;
  owner?: string;
  OR?: Array<{
    subject?: { contains: string; mode: 'insensitive' };
    content?: { contains: string; mode: 'insensitive' };
    company?: { contains: string; mode: 'insensitive' };
    category?: any;
  }>;
  AND?: Array<{
    OR?: Array<{
      subject?: { contains: string; mode: 'insensitive' };
      content?: { contains: string; mode: 'insensitive' };
      company?: { contains: string; mode: 'insensitive' };
      category?: any;
    }>;
  }>;
}

// Validation functions
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

/**
 * Xử lý GET request - có thể lấy filter options hoặc danh sách tickets
 * @param request - Request object
 * @returns Response với filter options hoặc danh sách tickets
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Nếu action là 'filters', trả về filter options
    if (action === 'filters') {
      // Lấy tất cả tickets để extract categories và owners
      const tickets = await prisma.ticket.findMany({
        select: {
          category: true,
          owner: true
        }
      });

      // Extract unique categories từ JSON format mới và cũ
      const categoriesSet = new Set<string>();
      
      tickets.forEach((ticket: Ticket) => {
        if (ticket.category) {
          // Xử lý JSON format mới {ids, label, count}
          if (typeof ticket.category === 'object' && ticket.category.label && Array.isArray(ticket.category.label)) {
            ticket.category.label.forEach((cat: string) => {
              if (cat && cat.trim()) categoriesSet.add(cat.trim());
            });
          }
          // Xử lý JSON format cũ {primary, values, count}
          else if (typeof ticket.category === 'object' && ticket.category.values && Array.isArray(ticket.category.values)) {
            ticket.category.values.forEach((cat: string) => {
              if (cat && cat.trim()) categoriesSet.add(cat.trim());
            });
          }
          // Xử lý JSON format cũ với primary
          else if (typeof ticket.category === 'object' && ticket.category.primary) {
            if (ticket.category.primary.trim()) categoriesSet.add(ticket.category.primary.trim());
          }
          // Xử lý category là string đơn thuần
          else if (typeof ticket.category === 'string' && ticket.category.trim()) {
            categoriesSet.add(ticket.category.trim());
          }
        }
      });

      // Extract unique owners
      const ownersSet = new Set<string>();
      
      tickets.forEach((ticket: Ticket) => {
        if (ticket.owner && ticket.owner.trim()) {
          ownersSet.add(ticket.owner.trim());
        }
      });

      // Chuyển đổi Set thành Array và sắp xếp
      const categories = Array.from(categoriesSet).sort();
      const owners = Array.from(ownersSet).sort();

      return NextResponse.json({
        success: true,
        data: {
          categories,
          owners
        }
      });
    }
    
    // Mặc định: lấy danh sách tickets với phân trang và filter
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
    
    // Cập nhật filter cho category để hỗ trợ JSON format mới với trường label
    if (category && category !== 'all') {
      where.OR = [
        // Tìm kiếm trong JSON array label (format mới)
        {
          category: {
            path: ['label'],
            array_contains: category
          }
        },
        // Fallback: tìm kiếm trong JSON array values (format cũ)
        {
          category: {
            path: ['values'],
            array_contains: category
          }
        },
        // Fallback: tìm kiếm trong trường primary (format cũ)
        {
          category: {
            path: ['primary'],
            equals: category
          }
        },
        // Fallback: category là string đơn thuần
        {
          category: {
            equals: category
          }
        }
      ];
    }
    
    if (owner) {
      where.owner = owner;
    }
    
    if (search) {
      // Nếu đã có OR cho category, cần merge với search OR
      if (where.OR) {
        // Tạo một where clause phức tạp hơn
        const categoryOR = where.OR;
        delete where.OR;
        
        where.AND = [
          {
            OR: categoryOR
          },
          {
            OR: [
              { subject: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } }
            ]
          }
        ];
      } else {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } }
        ];
      }
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
    console.error('Lỗi xử lý GET request:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi xử lý request' },
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
    
    // Xử lý category data - chuyển đổi từ string array thành JSON format mới
    if (ticketData.categories && Array.isArray(ticketData.categories)) {
      ticketData.category = {
        ids: ticketData.categoryIds || ticketData.categories, // Sử dụng categoryIds nếu có
        label: ticketData.categories,
        count: ticketData.categories.length
      };
      delete ticketData.categories; // Xóa field cũ
      delete ticketData.categoryIds; // Xóa field cũ nếu có
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