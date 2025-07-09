import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lấy danh sách lịch sử đồng bộ với phân trang
 * @param request - NextRequest object
 * @returns Danh sách sync logs với thông tin phân trang
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const syncType = searchParams.get('syncType'); // Filter theo loại sync
    const status = searchParams.get('status'); // Filter theo trạng thái
    
    const skip = (page - 1) * limit;
    
    // Tạo where condition cho filter
    const where: any = {};
    if (syncType) {
      where.syncType = syncType;
    }
    if (status) {
      where.status = status;
    }
    
    // Lấy danh sách sync logs với phân trang và filter
    const [syncLogs, total] = await Promise.all([
      prisma.syncLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.syncLog.count({ where })
    ]);
    
    // Tính toán thống kê tổng quan
    const stats = await prisma.syncLog.aggregate({
      where,
      _sum: {
        totalFetched: true,
        totalSaved: true
      },
      _count: {
        id: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: syncLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalSyncs: stats._count.id,
        totalFetched: stats._sum.totalFetched || 0,
        totalSaved: stats._sum.totalSaved || 0
      }
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Lỗi khi lấy lịch sử đồng bộ',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Lấy thống kê tổng quan về sync logs
 * @returns Thống kê sync logs
 */
export async function POST(request: NextRequest) {
  try {
    const { dateRange } = await request.json();
    
    let dateFilter = {};
    if (dateRange) {
      const { startDate, endDate } = dateRange;
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }
    
    // Thống kê theo ngày
    const dailyStats = await prisma.syncLog.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: {
        id: true
      },
      _sum: {
        totalFetched: true,
        totalSaved: true
      }
    });
    
    // Thống kê theo range
    const rangeStats = await prisma.syncLog.groupBy({
      by: ['range'],
      where: dateFilter,
      _count: {
        id: true
      },
      _sum: {
        totalFetched: true,
        totalSaved: true
      }
    });
    
    return NextResponse.json({
      success: true,
      dailyStats,
      rangeStats
    });
  } catch (error) {
    console.error('Error fetching sync stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Lỗi khi lấy thống kê đồng bộ',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}