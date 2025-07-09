import { NextRequest, NextResponse } from 'next/server';
import DatabaseManager from '@/lib/db';
import { Ticket } from '@/types/ticket';

/**
 * Interface cho query parameters
 */
interface TicketQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * GET handler để lấy danh sách tickets với filter và phân trang
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: TicketQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const db = DatabaseManager.getInstance();
    
    // Tính toán offset cho phân trang
    const offset = ((query.page || 1) - 1) * (query.limit || 50);
    
    // Xây dựng câu query với điều kiện filter
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    
    // Filter theo ngày tạo
    if (query.startDate) {
      whereConditions.push('DATE(created_date) >= DATE(?)');
      queryParams.push(query.startDate);
    }
    
    if (query.endDate) {
      whereConditions.push('DATE(created_date) <= DATE(?)');
      queryParams.push(query.endDate);
    }
    
    // Filter theo từ khóa tìm kiếm
    if (query.search) {
      whereConditions.push('(subject LIKE ? OR company_name LIKE ? OR content LIKE ?)');
      const searchTerm = `%${query.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Query để lấy tickets
    const ticketsQuery = `
      SELECT * FROM tickets 
      ${whereClause}
      ORDER BY created_date DESC 
      LIMIT ? OFFSET ?
    `;
    
    // Query để đếm tổng số tickets
    const countQuery = `
      SELECT COUNT(*) as total FROM tickets 
      ${whereClause}
    `;
    
    // Thực hiện queries
    const ticketsStmt = db.db.prepare(ticketsQuery);
    const countStmt = db.db.prepare(countQuery);
    
    const tickets = ticketsStmt.all(...queryParams, query.limit, offset) as Ticket[];
    const { total } = countStmt.get(...queryParams) as { total: number };
    
    // Tính toán thông tin phân trang
    const totalPages = Math.ceil(total / (query.limit || 50));
    const hasNextPage = (query.page || 1) < totalPages;
    const hasPrevPage = (query.page || 1) > 1;
    
    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: query.page || 1,
          totalPages,
          totalItems: total,
          itemsPerPage: query.limit || 50,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          startDate: query.startDate,
          endDate: query.endDate,
          search: query.search
        }
      }
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy tickets:', error);
    
    return NextResponse.json(
      { 
        error: 'Lỗi server khi lấy danh sách tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}