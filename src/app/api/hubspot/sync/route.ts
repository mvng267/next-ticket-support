import { NextRequest, NextResponse } from 'next/server';
import HubSpotAPI from '@/lib/hubspot';
import DatabaseManager from '@/lib/db';
import { SyncPayload, Ticket, HubSpotTicket } from '@/types/ticket';

/**
 * Chuyển đổi dữ liệu từ HubSpot format sang SQLite format
 */
function transformHubSpotTicket(
  hubspotTicket: HubSpotTicket, 
  ownerName?: string, 
  pipelineStages?: Record<string, string>,
  ticketCategories?: Record<string, string>
): Ticket {
  const props = hubspotTicket.properties;
  
  return {
    id: props.hs_ticket_id || hubspotTicket.id,
    category_value: props.hs_ticket_category || '',
    category_label: ticketCategories?.[props.hs_ticket_category || ''] || '',
    owner_id: props.hubspot_owner_id || '',
    owner_name: ownerName || 'Không có người phụ trách',
    company_name: props.hs_primary_company_name || '',
    subject: props.subject || '',
    source_type: props.source_type || '',
    content: props.content || '',
    pipeline_stage_value: props.hs_pipeline_stage || '',
    pipeline_stage_label: pipelineStages?.[props.hs_pipeline_stage || ''] || '',
    support_object_value: props.support_object || '',
    support_object_label: '', // Sẽ cần API riêng để lấy
    created_date: props.createdate || hubspotTicket.createdAt,
    synced_at: new Date().toISOString()
  };
}

/**
 * POST handler cho sync endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const payload: SyncPayload = await request.json();
    
    if (payload.trigger !== 'sync') {
      return NextResponse.json(
        { error: 'Invalid payload. Expected trigger: "sync"' },
        { status: 400 }
      );
    }

    const days = payload.days || 7; // Mặc định 7 ngày
    
    console.log(`Bắt đầu đồng bộ TẤT CẢ tickets từ ${days} ngày trước với phân trang...`);
    
    // Khởi tạo HubSpot API và Database
    const hubspotAPI = new HubSpotAPI();
    const db = DatabaseManager.getInstance();
    
    // Lấy metadata
    console.log('Đang lấy metadata...');
    const [pipelineStages, ticketCategories] = await Promise.all([
      hubspotAPI.getPipelineStages(),
      hubspotAPI.getTicketCategories()
    ]);
    
    // Lấy TẤT CẢ tickets từ HubSpot với phân trang
    console.log('Đang lấy TẤT CẢ tickets từ HubSpot với phân trang...');
    const hubspotTickets = await hubspotAPI.searchAllTickets(days);
    
    console.log(`Tìm thấy ${hubspotTickets.length} tickets từ HubSpot (đã phân trang)`);
    
    if (hubspotTickets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có tickets mới để đồng bộ',
        synced: 0
      });
    }
    
    // Chuyển đổi và lưu tickets
    const tickets: Ticket[] = [];
    
    console.log('Đang xử lý và chuyển đổi tickets...');
    for (let i = 0; i < hubspotTickets.length; i++) {
      const hubspotTicket = hubspotTickets[i];
      
      // Log tiến trình mỗi 50 tickets
      if (i % 50 === 0) {
        console.log(`Đang xử lý ticket ${i + 1}/${hubspotTickets.length}...`);
      }
      
      // Lấy thông tin owner nếu có
      let ownerName: string | undefined;
      if (hubspotTicket.properties.hubspot_owner_id) {
        ownerName = await hubspotAPI.getOwnerInfo(hubspotTicket.properties.hubspot_owner_id);
      }
      
      const ticket = transformHubSpotTicket(hubspotTicket, ownerName, pipelineStages, ticketCategories);
      tickets.push(ticket);
    }
    
    // Lưu vào database
    console.log('Đang lưu vào database...');
    db.upsertTickets(tickets);
    
    console.log(`Đã đồng bộ thành công ${tickets.length} tickets`);
    
    return NextResponse.json({
      success: true,
      message: `Đã đồng bộ thành công ${tickets.length} tickets từ ${days} ngày trước (sử dụng phân trang)`,
      synced: tickets.length,
      days,
      sampleTicket: tickets[0] // Trả về ticket đầu tiên để debug
    });
    
  } catch (error) {
    console.error('Lỗi trong quá trình đồng bộ:', error);
    
    return NextResponse.json(
      { 
        error: 'Lỗi server khi đồng bộ tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler để lấy thông tin tickets
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const db = DatabaseManager.getInstance();
    const tickets = db.getTickets(limit, offset);
    const total = db.getTicketCount();
    
    return NextResponse.json({
      success: true,
      data: {
        tickets,
        total,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy tickets:', error);
    
    return NextResponse.json(
      { 
        error: 'Lỗi server khi lấy tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}