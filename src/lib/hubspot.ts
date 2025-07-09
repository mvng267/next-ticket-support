import { HubSpotSearchResponse, HubSpotTicket, HubSpotOwner, HubSpotPipeline } from '@/types/ticket';

/**
 * Lớp xử lý tương tác với HubSpot API
 */
class HubSpotAPI {
  private apiKey: string;
  private baseUrl = 'https://api.hubapi.com';

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('HUBSPOT_API_KEY không được tìm thấy trong biến môi trường');
    }
  }

  /**
   * Tính toán ngày bắt đầu dựa trên số ngày trước (timestamp milliseconds)
   */
  private getStartDate(days: number): number {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0); // Bắt đầu từ 00:00:00
    return date.getTime();
  }

  /**
   * Lấy một trang tickets từ HubSpot
   */
  private async searchTicketsPage(
    days: number = 7, 
    limit: number = 100, 
    after?: string
  ): Promise<HubSpotSearchResponse> {
    const startDate = this.getStartDate(days);
    
    const searchPayload: any = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'createdate',
              operator: 'GTE',
              value: startDate.toString()
            }
          ]
        }
      ],
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
      limit,
      sorts: [
        {
          propertyName: 'createdate',
          direction: 'DESCENDING'
        }
      ]
    };

    // Thêm after parameter nếu có (để phân trang)
    if (after) {
      searchPayload.after = after;
    }

    try {
      console.log('Gọi HubSpot API với payload:', JSON.stringify(searchPayload, null, 2));
      
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/tickets/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HubSpot API Error Response:', errorText);
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data: HubSpotSearchResponse = await response.json();
      console.log(`HubSpot API Response - Trang hiện tại: ${data.results?.length || 0} tickets, Có trang tiếp: ${!!data.paging?.next?.after}`);
      
      return data;
    } catch (error) {
      console.error('Lỗi khi gọi HubSpot API:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả tickets từ HubSpot với phân trang tự động
   */
  public async searchAllTickets(days: number = 7, pageSize: number = 100): Promise<HubSpotTicket[]> {
    const allTickets: HubSpotTicket[] = [];
    let after: string | undefined;
    let pageCount = 0;
    const maxPages = 50; // Giới hạn tối đa 50 trang để tránh vòng lặp vô hạn

    console.log(`Bắt đầu lấy tất cả tickets từ ${days} ngày trước với phân trang...`);

    do {
      pageCount++;
      console.log(`Đang lấy trang ${pageCount}${after ? ` (after: ${after})` : ''}...`);
      
      try {
        const response = await this.searchTicketsPage(days, pageSize, after);
        
        if (response.results && response.results.length > 0) {
          allTickets.push(...response.results);
          console.log(`Trang ${pageCount}: Lấy được ${response.results.length} tickets. Tổng cộng: ${allTickets.length}`);
        }
        
        // Kiểm tra xem có trang tiếp theo không
        after = response.paging?.next?.after;
        
        // Nghỉ một chút giữa các request để tránh rate limiting
        if (after) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`Lỗi khi lấy trang ${pageCount}:`, error);
        break;
      }
      
      // Kiểm tra giới hạn trang
      if (pageCount >= maxPages) {
        console.warn(`Đã đạt giới hạn tối đa ${maxPages} trang. Dừng lại.`);
        break;
      }
      
    } while (after);

    console.log(`Hoàn thành phân trang. Tổng cộng lấy được ${allTickets.length} tickets từ ${pageCount} trang.`);
    return allTickets;
  }

  /**
   * Lấy danh sách tickets từ HubSpot (phương thức cũ, giữ lại để tương thích)
   */
  public async searchTickets(days: number = 7, limit: number = 100): Promise<HubSpotTicket[]> {
    // Nếu limit <= 100, sử dụng phương thức cũ
    if (limit <= 100) {
      const response = await this.searchTicketsPage(days, limit);
      return response.results || [];
    }
    
    // Nếu limit > 100, sử dụng phân trang
    return this.searchAllTickets(days, 100);
  }

  /**
   * Lấy thông tin owner (người tạo ticket)
   */
  public async getOwnerInfo(ownerId: string): Promise<string> {
    if (!ownerId || ownerId === 'null' || ownerId === 'undefined') {
      return 'Không có người phụ trách';
    }

    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/owners/${ownerId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Không thể lấy thông tin owner ${ownerId}: ${response.status}`);
        return 'Không xác định';
      }

      const data: HubSpotOwner = await response.json();
      return data.firstName && data.lastName 
        ? `${data.firstName} ${data.lastName}`
        : data.email || 'Không xác định';
    } catch (error) {
      console.error('Lỗi khi lấy thông tin owner:', error);
      return 'Không xác định';
    }
  }

  /**
   * Lấy metadata cho pipeline stages
   */
  public async getPipelineStages(): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/pipelines/tickets`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Không thể lấy pipeline stages: ${response.status}`);
        return {};
      }

      const data = await response.json();
      const stageMap: Record<string, string> = {};
      
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((pipeline: HubSpotPipeline) => {
          if (pipeline.stages && Array.isArray(pipeline.stages)) {
            pipeline.stages.forEach((stage) => {
              stageMap[stage.id] = stage.label;
            });
          }
        });
      }

      console.log('Pipeline stages loaded:', stageMap);
      return stageMap;
    } catch (error) {
      console.error('Lỗi khi lấy pipeline stages:', error);
      return {};
    }
  }

  /**
   * Lấy metadata cho ticket categories
   */
  public async getTicketCategories(): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/properties/tickets/hs_ticket_category`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Không thể lấy ticket categories: ${response.status}`);
        return {};
      }

      const data = await response.json();
      const categoryMap: Record<string, string> = {};
      
      if (data.options && Array.isArray(data.options)) {
        data.options.forEach((option: any) => {
          categoryMap[option.value] = option.label;
        });
      }

      console.log('Ticket categories loaded:', categoryMap);
      return categoryMap;
    } catch (error) {
      console.error('Lỗi khi lấy ticket categories:', error);
      return {};
    }
  }
}

export default HubSpotAPI;