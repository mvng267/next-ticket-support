// API route cập nhật thông tin chi tiết ticket từ HubSpot
import { NextRequest, NextResponse } from 'next/server';
import { fetchTicketById, fetchOwnerInfo, fetchTicketCategoryLabel } from '@/lib/hubspot';
import { updateTicketInFirestore } from '@/lib/firestore';
import { ApiResponse } from '@/types';

/**
 * POST /api/hubspot/update-ticket
 * Cập nhật thông tin chi tiết ticket từ HubSpot vào Firebase
 */
export async function POST(request: NextRequest) {
  try {
    const { ticketId } = await request.json();
    
    if (!ticketId) {
      return NextResponse.json({
        success: false,
        message: 'Ticket ID is required',
        error: 'Missing ticketId parameter'
      } as ApiResponse, { status: 400 });
    }

    const logs: string[] = [];
    logs.push(`🔍 Đang lấy thông tin chi tiết cho ticket ID: ${ticketId}`);

    // Lấy thông tin ticket từ HubSpot
    const hubspotTicket = await fetchTicketById(ticketId);
    if (!hubspotTicket) {
      return NextResponse.json({
        success: false,
        message: 'Ticket not found in HubSpot',
        error: `Ticket ${ticketId} not found`
      } as ApiResponse, { status: 404 });
    }

    logs.push('📥 Đã lấy thông tin ticket từ HubSpot');

    // Hàm helper để lấy giá trị từ property
    const getPropertyValue = (prop: unknown): string => {
      if (!prop) return '';
      if (typeof prop === 'string') return prop;
      if (typeof prop === 'object' && prop !== null && 'value' in prop) {
        return String((prop as { value: unknown }).value);
      }
      return String(prop);
    };

    // Xử lý dữ liệu chi tiết
    const props = hubspotTicket.properties || {};
    
    // Lấy createdate dưới dạng string nguyên bản
    const createDateValue = getPropertyValue(props.createdate);
    logs.push(`📅 CreateDate từ HubSpot (string): "${createDateValue}"`);
    
    const detailedTicket = {
      ticketId: getPropertyValue(props.hs_ticket_id) || ticketId,
      category: getPropertyValue(props.hs_ticket_category),
      categoryLabel: '',
      ownerId: getPropertyValue(props.hubspot_owner_id),
      ownerName: '',
      companyName: getPropertyValue(props.hs_primary_company_name),
      subject: getPropertyValue(props.subject),
      sourceType: getPropertyValue(props.source_type),
      content: getPropertyValue(props.content),
      pipelineStage: getPropertyValue(props.hs_pipeline_stage),
      supportObject: getPropertyValue(props.support_object),
      createDate: createDateValue, // LƯU DƯỚI DẠNG STRING NGUYÊN BẢN
      syncedAt: new Date().toISOString() // CHỈ syncedAt là ISO string của ngày hiện tại
    };
    
    logs.push(`📋 CreateDate cuối cùng (string): "${detailedTicket.createDate}"`);

    // Lấy thông tin owner nếu có
    if (detailedTicket.ownerId) {
      try {
        logs.push('👤 Đang lấy thông tin owner...');
        const ownerName = await fetchOwnerInfo(detailedTicket.ownerId);
        detailedTicket.ownerName = String(ownerName || 'Unknown');
        logs.push(`✅ Owner: ${detailedTicket.ownerName}`);
      } catch (error) {
        console.warn('Failed to fetch owner info:', error);
        detailedTicket.ownerName = 'Unknown';
        logs.push('⚠️ Không thể lấy thông tin owner');
      }
    }

    // Lấy category label nếu có
    if (detailedTicket.category) {
      try {
        logs.push('🏷️ Đang lấy category label...');
        const categoryLabel = await fetchTicketCategoryLabel(detailedTicket.category);
        detailedTicket.categoryLabel = String(categoryLabel || detailedTicket.category);
        logs.push(`✅ Category: ${detailedTicket.categoryLabel}`);
      } catch (error) {
        console.warn('Failed to fetch category label:', error);
        detailedTicket.categoryLabel = detailedTicket.category;
        logs.push('⚠️ Không thể lấy category label');
      }
    }

    // Cập nhật vào Firebase
    logs.push('💾 Đang cập nhật vào Firebase...');
    await updateTicketInFirestore(ticketId, detailedTicket);
    logs.push('🎉 Đã cập nhật thành công!');

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật thành công ticket ${ticketId}`,
      data: {
        ticketId: detailedTicket.ticketId,
        subject: detailedTicket.subject,
        category: detailedTicket.category,
        categoryLabel: detailedTicket.categoryLabel,
        ownerName: detailedTicket.ownerName,
        companyName: detailedTicket.companyName,
        sourceType: detailedTicket.sourceType,
        pipelineStage: detailedTicket.pipelineStage,
        createDate: detailedTicket.createDate
      },
      logs
    } as ApiResponse);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating ticket:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi cập nhật ticket',
      error: errorMessage,
      logs: [`❌ Lỗi: ${errorMessage}`]
    } as ApiResponse, { status: 500 });
  }
}