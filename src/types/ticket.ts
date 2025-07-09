/**
 * Định nghĩa kiểu dữ liệu cho Ticket từ HubSpot API response
 */
export interface HubSpotTicketProperties {
  hs_ticket_id: string;
  hs_ticket_category?: string;
  hubspot_owner_id?: string;
  hs_primary_company_name?: string;
  subject?: string;
  source_type?: string;
  content?: string;
  hs_pipeline_stage?: string;
  support_object?: string;
  createdate?: string;
}

export interface HubSpotTicket {
  id: string;
  properties: HubSpotTicketProperties;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

/**
 * Kiểu dữ liệu Ticket được lưu trong SQLite
 */
export interface Ticket {
  id: string; // hs_ticket_id
  category_value: string;
  category_label?: string;
  owner_id: string;
  owner_name?: string;
  company_name: string;
  subject: string;
  source_type: string;
  content: string;
  pipeline_stage_value: string;
  pipeline_stage_label?: string;
  support_object_value: string;
  support_object_label?: string;
  created_date: string;
  synced_at: string; // Thời gian đồng bộ
}

/**
 * Response từ HubSpot API
 */
export interface HubSpotSearchResponse {
  results: HubSpotTicket[];
  total?: number;
  paging?: {
    next?: {
      after: string;
      link?: string;
    };
  };
}

/**
 * Payload để điều khiển sync
 */
export interface SyncPayload {
  trigger: 'sync';
  days?: 1 | 7 | 30 | 180; // 1 ngày, 7 ngày, 30 ngày, 6 tháng
}

/**
 * HubSpot Owner response
 */
export interface HubSpotOwner {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * HubSpot Pipeline Stage
 */
export interface HubSpotPipelineStage {
  id: string;
  label: string;
  displayOrder: number;
}

/**
 * HubSpot Pipeline
 */
export interface HubSpotPipeline {
  id: string;
  label: string;
  stages: HubSpotPipelineStage[];
}