

// Định nghĩa các kiểu dữ liệu cho ứng dụng
export interface HubSpotTicket {
  id: string;
  properties: {
    hs_ticket_id: {
      value: string;
    };
    hs_ticket_category: {
      value: string;
      label?: string;
    };
    hubspot_owner_id: {
      value: string;
    };
    hs_primary_company_name: {
      value: string;
    };
    subject: {
      value: string;
    };
    source_type: {
      value: string;
    };
    content: {
      value: string;
    };
    hs_pipeline_stage: {
      value: string;
    };
    support_object: {
      value: string;
    };
    createdate: {
      value: string;
    };
  };
}

export interface ProcessedTicket {
  id: string;
  ticketId: string;
  category: string;
  categoryLabel: string;
  ownerId: string;
  ownerName: string;
  companyName: string;
  subject: string;
  sourceType: string;
  content: string;
  pipelineStage: string;
  pipelineStageLabel: string; // THÊM FIELD MỚI
  supportObject: string;
  createDate: string; // Lưu dưới dạng string từ HubSpot
  syncedAt: string;
}

export interface HubSpotSearchResponse {
  results: HubSpotTicket[];
  total: number;
  paging?: {
    next?: {
      after: string;
    };
  };
}

export interface SyncPayload {
  trigger: 'test' | 'sync_all' | 'sync_30_days' | 'sync_7_days' | 'sync_1_day';
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
  logs?: string[]; // Thêm logs để hiển thị
}

// Progress callback type
export type ProgressCallback = (current: number, total: number, message: string) => void;
