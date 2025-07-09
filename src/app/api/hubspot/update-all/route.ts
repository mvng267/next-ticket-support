// API route cập nhật tất cả tickets trong Firebase
import { NextRequest, NextResponse } from 'next/server';
import { getTicketsFromFirestore } from '@/lib/firestore';
import { ApiResponse } from '@/types';

/**
 * POST /api/hubspot/update-all
 * Cập nhật tất cả tickets trong Firebase với thông tin mới từ HubSpot
 */
export async function POST(request: NextRequest) {
  try {
    const logs: string[] = [];
    logs.push('🔄 Bắt đầu cập nhật tất cả tickets...');
    
    // Lấy tất cả tickets từ Firebase
    const tickets = await getTicketsFromFirestore();
    logs.push(`📋 Tìm thấy ${tickets.length} tickets trong Firebase`);
    
    if (tickets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có tickets nào để cập nhật',
        data: { count: 0 },
        logs
      } as ApiResponse);
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Cập nhật từng ticket
    for (const ticket of tickets) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/hubspot/update-ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ticketId: ticket.ticketId })
        });
        
        if (response.ok) {
          successCount++;
          logs.push(`✅ Cập nhật thành công ticket ${ticket.ticketId}`);
        } else {
          errorCount++;
          logs.push(`❌ Lỗi cập nhật ticket ${ticket.ticketId}`);
        }
        
        // Delay để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        errorCount++;
        logs.push(`❌ Lỗi cập nhật ticket ${ticket.ticketId}: ${error}`);
      }
    }
    
    logs.push(`🎉 Hoàn thành: ${successCount} thành công, ${errorCount} lỗi`);
    
    return NextResponse.json({
      success: true,
      message: `Đã cập nhật ${successCount}/${tickets.length} tickets`,
      data: {
        total: tickets.length,
        success: successCount,
        errors: errorCount
      },
      logs
    } as ApiResponse);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating all tickets:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi cập nhật tickets',
      error: errorMessage
    } as ApiResponse, { status: 500 });
  }
}