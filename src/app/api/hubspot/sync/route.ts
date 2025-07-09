import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface cho HubSpot Owner
interface HubSpotOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

interface HubSpotOwnersResponse {
  results: HubSpotOwner[];
}

// Interface cho Pipeline Stage
interface HubSpotPipelineStage {
  id: string;
  label: string;
  displayOrder: number;
  metadata?: {
    ticketState?: string;
  };
}

interface HubSpotPipeline {
  id: string;
  label: string;
  stages: HubSpotPipelineStage[];
}

interface HubSpotPipelinesResponse {
  results: HubSpotPipeline[];
}

// Interface cho Category Property Response từ HubSpot API
interface CategoryOption {
  value: string;
  label: string;
  description?: string;
  hidden?: boolean;
  displayOrder?: number;
}

interface CategoryPropertyResponse {
  name: string;
  label: string;
  description?: string;
  groupName?: string;
  type: string;
  fieldType: string;
  options: CategoryOption[];
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
}

// Interface cho HubSpot API
interface HubSpotRequestBody {
  filterGroups: Array<{
    filters: Array<{
      propertyName: string;
      operator: string;
      value: number;
    }>;
  }>;
  properties: string[];
  limit: number;
  after?: string;
}

interface HubSpotTicket {
  properties: {
    hs_ticket_id: string;
    subject?: string;
    content?: string;
    hubspot_owner_id?: string;
    hs_primary_company_name?: string;
    createdate: string;
    hs_ticket_category?: string;
    hs_pipeline_stage?: string;
    source_type?: string;
    support_object?: string;
  };
}

interface HubSpotResponse {
  results: HubSpotTicket[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

interface SyncLogData {
  syncType: string;
  range: string;
  totalFetched: number;
  totalSaved: number;
  startDate: Date;
  endDate: Date;
  status: string;
  errorMessage?: string;
}

/**
 * Lấy danh sách owners từ HubSpot API
 * @returns Map từ owner ID sang tên đầy đủ
 */
async function fetchHubSpotOwners(): Promise<Map<string, string>> {
  try {
    const ownersResponse = await fetch('https://api.hubapi.com/crm/v3/owners', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ownersResponse.ok) {
      console.warn(`HubSpot Owners API error: ${ownersResponse.status}`);
      return new Map();
    }

    const ownersData: HubSpotOwnersResponse = await ownersResponse.json();
    const ownerMap = new Map<string, string>();

    ownersData.results.forEach(owner => {
      const fullName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email;
      ownerMap.set(owner.id, fullName);
    });

    console.log(`Đã lấy thông tin ${ownerMap.size} owners từ HubSpot`);
    return ownerMap;
  } catch (error) {
    console.error('Lỗi lấy thông tin owners:', error);
    return new Map();
  }
}

/**
 * Lấy danh sách pipeline stages từ HubSpot API
 * @returns Map từ stage ID sang label
 */
async function fetchHubSpotPipelineStages(): Promise<Map<string, string>> {
  try {
    const pipelinesResponse = await fetch('https://api.hubapi.com/crm/v3/pipelines/tickets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!pipelinesResponse.ok) {
      console.warn(`HubSpot Pipelines API error: ${pipelinesResponse.status}`);
      return new Map();
    }

    const pipelinesData: HubSpotPipelinesResponse = await pipelinesResponse.json();
    const stageMap = new Map<string, string>();

    pipelinesData.results.forEach(pipeline => {
      pipeline.stages.forEach(stage => {
        stageMap.set(stage.id, stage.label);
      });
    });

    console.log(`Đã lấy thông tin ${stageMap.size} pipeline stages từ HubSpot`);
    return stageMap;
  } catch (error) {
    console.error('Lỗi lấy thông tin pipeline stages:', error);
    return new Map();
  }
}

/**
 * Lấy danh sách category options từ HubSpot Property API
 * @returns Map từ category ID sang label
 */
async function fetchHubSpotCategoryOptions(): Promise<Map<string, string>> {
  try {
    const categoryResponse = await fetch('https://api.hubapi.com/crm/v3/properties/tickets/hs_ticket_category', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!categoryResponse.ok) {
      console.warn(`HubSpot Category Property API error: ${categoryResponse.status}`);
      return new Map();
    }

    const categoryData: CategoryPropertyResponse = await categoryResponse.json();
    const categoryMap = new Map<string, string>();

    if (categoryData.options && Array.isArray(categoryData.options)) {
      categoryData.options.forEach(option => {
        categoryMap.set(option.value, option.label);
      });
    }

    console.log(`Đã lấy thông tin ${categoryMap.size} category options từ HubSpot`);
    return categoryMap;
  } catch (error) {
    console.error('Lỗi lấy thông tin category options:', error);
    return new Map();
  }
}

// Rate limiting class
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 100; // HubSpot limit
  private readonly timeWindow = 10000; // 10 seconds

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}

// Hàm helper để xử lý createdate từ HubSpot
function parseHubSpotDate(dateValue: string): Date {
  // Kiểm tra nếu là timestamp milliseconds (chỉ chứa số)
  if (/^\d+$/.test(dateValue)) {
    return new Date(parseInt(dateValue));
  }
  
  // Nếu là ISO string hoặc format khác
  const parsedDate = new Date(dateValue);
  
  // Kiểm tra nếu date hợp lệ
  if (isNaN(parsedDate.getTime())) {
    console.warn(`Invalid date format from HubSpot: ${dateValue}`);
    return new Date(); // Fallback to current date
  }
  
  return parsedDate;
}

/**
 * Đồng bộ tickets từ HubSpot API với phân trang để lấy hết tất cả data
 * @param request - Request object chứa range parameter
 * @returns Response với status và data
 */
export async function POST(request: NextRequest) {
  try {
    const { range } = await request.json();
    
    // Tính toán ngày bắt đầu dựa trên range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Lấy thông tin owners, pipeline stages và category options song song
    console.log('Đang lấy thông tin owners, pipeline stages và category options từ HubSpot...');
    const [ownerMap, stageMap, categoryMap] = await Promise.all([
      fetchHubSpotOwners(),
      fetchHubSpotPipelineStages(),
      fetchHubSpotCategoryOptions()
    ]);

    // Lấy tất cả tickets từ HubSpot với phân trang
    const allTickets: HubSpotTicket[] = [];
    let after: string | null = null;
    let hasMore = true;
    const limit = 100; // HubSpot API limit per request
    
    const rateLimiter = new RateLimiter();
    
    while (hasMore) {
      await rateLimiter.waitIfNeeded();
      
      // Rate limiting để tránh bị HubSpot block
      if (allTickets.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      }
      
      const requestBody: HubSpotRequestBody = {
        filterGroups: [{
          filters: [{
            propertyName: 'createdate',
            operator: 'GTE',
            value: startDate.getTime()
          }]
        }],
        properties: [
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
        ],
        limit: limit
      };

      // Thêm after parameter cho phân trang
      if (after) {
        requestBody.after = after;
      }

      // Gọi HubSpot API
      const hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/tickets/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!hubspotResponse.ok) {
        throw new Error(`HubSpot API error: ${hubspotResponse.status} ${hubspotResponse.statusText}`);
      }

      const hubspotData: HubSpotResponse = await hubspotResponse.json();
      
      // Thêm tickets vào mảng tổng
      if (hubspotData.results && hubspotData.results.length > 0) {
        allTickets.push(...hubspotData.results);
      }

      // Kiểm tra có còn trang tiếp theo không
      if (hubspotData.paging && hubspotData.paging.next && hubspotData.paging.next.after) {
        after = hubspotData.paging.next.after;
        hasMore = true;
      } else {
        hasMore = false;
      }

      // Log progress
      console.log(`Đã lấy ${allTickets.length} tickets từ HubSpot...`);
    }
    
    console.log(`Tổng cộng lấy được ${allTickets.length} tickets từ HubSpot`);
    
    // Xử lý và lưu tickets
    const savedTickets: any[] = [];
    let processedCount = 0;

    /**
     * Xử lý và format dữ liệu category từ HubSpot với mapping ID sang label
     * @param categoryValue - Giá trị category từ HubSpot (có thể là string với multiple IDs)
     * @param categoryMap - Map từ category ID sang label
     * @returns Object chứa thông tin category theo format yêu cầu
     */
    function formatCategoryData(categoryValue: string | undefined, categoryMap: Map<string, string>): any {
      if (!categoryValue || categoryValue.trim() === '') {
        return null;
      }
    
      // Nếu category chứa multiple values (phân tách bằng dấu chấm phẩy)
      if (categoryValue.includes(';')) {
        const categoryIds = categoryValue.split(';')
          .map(id => id.trim())
          .filter(id => id !== '');
        
        // Chuyển đổi từ ID sang label
        const categoryLabels = categoryIds.map(id => {
          const label = categoryMap.get(id);
          return label || id; // Fallback to ID if label not found
        });
        
        return {
          count: categoryIds.length,
          ids: categoryIds,
          label: categoryLabels
        };
      }
      
      // Nếu chỉ có single value
      const categoryId = categoryValue.trim();
      const categoryLabel = categoryMap.get(categoryId) || categoryId;
      
      return {
        count: 1,
        ids: [categoryId],
        label: [categoryLabel]
      };
    }

    for (const ticket of allTickets) {
      try {
        // Lấy tên owner từ mapping
        const ownerName = ticket.properties.hubspot_owner_id 
          ? ownerMap.get(ticket.properties.hubspot_owner_id) || ticket.properties.hubspot_owner_id
          : '';

        // Lấy label của pipeline stage thay vì ID
        const pipelineStageLabel = ticket.properties.hs_pipeline_stage
          ? stageMap.get(ticket.properties.hs_pipeline_stage) || ticket.properties.hs_pipeline_stage
          : '';

        // Format category data thành object với cả ID và label riêng biệt
        const categoryData = formatCategoryData(ticket.properties.hs_ticket_category, categoryMap);

        const ticketData = {
          id: ticket.properties.hs_ticket_id,
          subject: ticket.properties.subject || '',
          content: ticket.properties.content || '',
          owner: ownerName,
          company: ticket.properties.hs_primary_company_name || '',
          createDate: parseHubSpotDate(ticket.properties.createdate),
          category: categoryData, // Sử dụng object với cả ID và label
          pipelineStage: pipelineStageLabel,
          sourceType: ticket.properties.source_type || '',
          supportObject: ticket.properties.support_object || ''
        };

        // Upsert ticket với logic update đầy đủ
        const savedTicket = await prisma.ticket.upsert({
          where: { id: ticketData.id },
          update: {
            subject: ticketData.subject,
            content: ticketData.content,
            owner: ticketData.owner,
            company: ticketData.company,
            createDate: ticketData.createDate,
            category: categoryData, // Cập nhật category object với cả ID và label
            pipelineStage: ticketData.pipelineStage,
            sourceType: ticketData.sourceType,
            supportObject: ticketData.supportObject
          },
          create: ticketData
        });
        
        savedTickets.push(savedTicket);
        processedCount++;

        // Log progress mỗi 50 tickets
        if (processedCount % 50 === 0) {
          console.log(`Đã xử lý ${processedCount}/${allTickets.length} tickets...`);
        }
      } catch (ticketError) {
        console.error(`Lỗi xử lý ticket ${ticket.properties.hs_ticket_id}:`, ticketError);
        // Tiếp tục xử lý ticket khác thay vì dừng toàn bộ
      }
    }

    // Lưu thông tin sync vào database
    try {
      await prisma.syncLog.create({
        data: {
          syncType: 'hubspot_tickets',
          range: range,
          totalFetched: allTickets.length,
          totalSaved: savedTickets.length,
          startDate: startDate,
          endDate: now,
          status: 'completed'
        }
      });
    } catch (syncLogError) {
      console.log('Không thể lưu sync log (bảng có thể chưa tồn tại):', syncLogError);
    }

    // Đóng kết nối Prisma
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: `Đã đồng bộ thành công ${savedTickets.length}/${allTickets.length} tickets với ${ownerMap.size} owners, ${stageMap.size} pipeline stages và ${categoryMap.size} categories`,
      data: {
        totalFetched: allTickets.length,
        totalSaved: savedTickets.length,
        totalOwners: ownerMap.size,
        totalStages: stageMap.size,
        totalCategories: categoryMap.size,
        range: range,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Lỗi đồng bộ HubSpot:', error);
    
    // Lưu thông tin lỗi vào database
    try {
      const { range } = await request.json().catch(() => ({ range: 'unknown' }));
      
      await prisma.syncLog.create({
        data: {
          syncType: 'hubspot_tickets',
          range: range,
          totalFetched: 0,
          totalSaved: 0,
          startDate: new Date(),
          endDate: new Date(),
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } catch (logError) {
      console.log('Không thể lưu error log:', logError);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Lỗi đồng bộ dữ liệu từ HubSpot',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Lấy trạng thái đồng bộ gần nhất và thống kê
 */
export async function GET() {
  try {
    const latestTicket = await prisma.ticket.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    const totalTickets = await prisma.ticket.count();
    
    // Lấy thông tin sync log gần nhất
    const latestSync = await prisma.syncLog.findFirst({
      where: { syncType: 'hubspot_tickets' },
      orderBy: { createdAt: 'desc' }
    }).catch(() => null); // Ignore error nếu bảng chưa tồn tại
    
    // Thống kê theo ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTickets = await prisma.ticket.count({
      where: {
        createDate: {
          gte: today
        }
      }
    });
    
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekTickets = await prisma.ticket.count({
      where: {
        createDate: {
          gte: thisWeek
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalTickets,
        todayTickets,
        weekTickets,
        latestTicketDate: latestTicket?.createDate || null,
        latestSync: latestSync ? {
          date: latestSync.createdAt,
          range: latestSync.range,
          totalFetched: latestSync.totalFetched,
          totalSaved: latestSync.totalSaved,
          status: latestSync.status,
          errorMessage: latestSync.errorMessage
        } : null
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin đồng bộ:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi lấy thông tin đồng bộ' },
      { status: 500 }
    );
  }
}