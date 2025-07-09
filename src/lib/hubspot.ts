// Xử lý tương tác với HubSpot API
import { HubSpotSearchResponse, HubSpotTicket } from '@/types';

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Định nghĩa danh sách properties cần lấy
const TICKET_PROPERTIES = [
  'hs_ticket_id',
  'hs_ticket_category', 
  'hubspot_owner_id',
  'hs_primary_company_name',
  'subject',
  'source_type',
  'content',
  'hs_pipeline_stage',
  'support_object',
  'createdate'
];

/**
 * Interface cho callback progress
 */
export interface ProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Lấy tickets từ HubSpot với phân trang cải tiến và progress callback
 */
export async function fetchTicketsFromHubSpot(
  daysBack?: number, 
  progressCallback?: ProgressCallback
): Promise<HubSpotTicket[]> {
  if (!ACCESS_TOKEN) {
    throw new Error('HubSpot access token không được cấu hình');
  }

  try {
    console.log(`Fetching tickets from HubSpot${daysBack ? ` (last ${daysBack} days)` : ' (all)'}...`);
    
    let allTickets: HubSpotTicket[] = [];
    let after: string | undefined;
    let hasMore = true;
    let pageCount = 0;
    let totalEstimate = 0;
    
    // Bước 1: Lấy trang đầu tiên để ước tính tổng số
    while (hasMore) {
      pageCount++;
      
      // Tạo payload cho Search API với phân trang
      const searchPayload: any = {
        properties: TICKET_PROPERTIES,
        limit: 100, // Giảm xuống 100 để tránh timeout
        after: after
      };
      
      // Thêm filter theo ngày nếu có
      if (daysBack && daysBack > 0) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - daysBack);
        const fromTimestamp = fromDate.getTime();
        
        searchPayload.filterGroups = [{
          filters: [{
            propertyName: 'createdate',
            operator: 'GTE',
            value: fromTimestamp.toString()
          }]
        }];
      }
      
      const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/tickets/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data: HubSpotSearchResponse = await response.json();
      
      // Ước tính tổng số từ trang đầu tiên
      if (pageCount === 1 && data.total) {
        totalEstimate = data.total;
        console.log(`📊 Ước tính tổng số tickets: ${totalEstimate}`);
      }
      
      if (data.results && data.results.length > 0) {
        allTickets.push(...data.results);
        
        // Gọi progress callback
        if (progressCallback) {
          const progress = totalEstimate > 0 
            ? Math.min(Math.round((allTickets.length / totalEstimate) * 100), 100)
            : Math.round((pageCount / 10) * 100); // Fallback progress
          
          progressCallback(
            allTickets.length, 
            totalEstimate || allTickets.length,
            `Đã lấy ${allTickets.length} tickets từ ${pageCount} trang`
          );
        }
        
        console.log(`📄 Trang ${pageCount}: ${data.results.length} tickets, Tổng: ${allTickets.length}`);
      }
      
      // Kiểm tra có trang tiếp theo không
      if (data.paging?.next?.after) {
        after = data.paging.next.after;
      } else {
        hasMore = false;
      }
      
      // Thêm delay để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Giới hạn an toàn để tránh infinite loop
      if (pageCount >= 50) {
        console.warn('⚠️ Đã đạt giới hạn 50 trang, dừng lại');
        break;
      }
    }
    
    console.log(`✅ Hoàn thành: ${allTickets.length} tickets từ ${pageCount} trang`);
    return allTickets;
    
  } catch (error) {
    console.error('❌ Lỗi khi lấy tickets từ HubSpot:', error);
    throw error;
  }
}

/**
 * Lấy thông tin owner từ HubSpot bằng owner ID
 */
export async function fetchOwnerInfo(ownerId: string): Promise<string> {
  if (!ACCESS_TOKEN || !ownerId) {
    return 'Unknown';
  }

  try {
    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/owners/${ownerId}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Không thể lấy thông tin owner ${ownerId}`);
      return 'Unknown';
    }

    const ownerData = await response.json();
    return ownerData.firstName && ownerData.lastName 
      ? `${ownerData.firstName} ${ownerData.lastName}`
      : ownerData.email || 'Unknown';
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin owner ${ownerId}:`, error);
    return 'Unknown';
  }
}

/**
 * Lấy label cho ticket category
 */
export async function fetchTicketCategoryLabel(categoryValue: string): Promise<string> {
  if (!ACCESS_TOKEN || !categoryValue) {
    return categoryValue;
  }

  try {
    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/properties/tickets/hs_ticket_category`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return categoryValue;
    }

    const propertyData = await response.json();
    const option = propertyData.options?.find((opt: any) => opt.value === categoryValue);
    return option?.label || categoryValue;
  } catch (error) {
    console.error('Lỗi khi lấy label cho category:', error);
    return categoryValue;
  }
}

/**
 * Lấy thông tin chi tiết ticket theo ID từ HubSpot
 */
export async function fetchTicketById(ticketId: string): Promise<HubSpotTicket | null> {
  if (!ACCESS_TOKEN || !ticketId) {
    throw new Error('HubSpot access token hoặc ticket ID không được cấu hình');
  }

  try {
    console.log(`Fetching ticket details for ID: ${ticketId}`);
    
    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/tickets/${ticketId}?properties=${TICKET_PROPERTIES.join(',')}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Ticket ${ticketId} not found`);
        return null;
      }
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    const ticket: HubSpotTicket = await response.json();
    console.log(`Successfully fetched ticket ${ticketId}`);
    
    return ticket;
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    throw error;
  }
}

/**
 * Lấy label cho support object (nếu cần)
 */
export async function fetchSupportObjectLabel(supportObjectValue: string): Promise<string> {
  if (!ACCESS_TOKEN || !supportObjectValue) {
    return supportObjectValue;
  }

  try {
    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/properties/tickets/support_object`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return supportObjectValue;
    }

    const propertyData = await response.json();
    const option = propertyData.options?.find((opt: any) => opt.value === supportObjectValue);
    return option?.label || supportObjectValue;
  } catch (error) {
    console.error('Lỗi khi lấy label cho support object:', error);
    return supportObjectValue;
  }
}

/**
 * Cache cho pipeline stages để tránh gọi API nhiều lần
 */
let pipelineStagesCache: { [key: string]: string } | null = null;

/**
 * Lấy label cho pipeline stage từ HubSpot
 */
export async function fetchPipelineStageLabel(stageId: string): Promise<string> {
  if (!ACCESS_TOKEN || !stageId) {
    return stageId;
  }

  try {
    // Sử dụng cache nếu đã có
    if (pipelineStagesCache && pipelineStagesCache[stageId]) {
      return pipelineStagesCache[stageId];
    }

    // Lấy tất cả pipelines cho tickets
    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/pipelines/tickets`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Không thể lấy thông tin pipeline stages`);
      return stageId;
    }

    const pipelinesData = await response.json();
    
    // Tạo cache mapping từ stageId sang label
    if (!pipelineStagesCache) {
      pipelineStagesCache = {};
    }
    
    // Duyệt qua tất cả pipelines và stages
    if (pipelinesData.results) {
      for (const pipeline of pipelinesData.results) {
        if (pipeline.stages) {
          for (const stage of pipeline.stages) {
            pipelineStagesCache[stage.id] = stage.label;
          }
        }
      }
    }
    
    return pipelineStagesCache[stageId] || stageId;
    
  } catch (error) {
    console.error(`Lỗi khi lấy label cho pipeline stage ${stageId}:`, error);
    return stageId;
  }
}