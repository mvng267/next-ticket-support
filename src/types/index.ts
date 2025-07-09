/**
 * Type definitions cho ứng dụng
 */

// Thêm interface cho Category JSON structure
export interface CategoryData {
  values: string[];        // Mảng các danh mục
  primary: string | null;  // Danh mục chính
  count: number;          // Số lượng danh mục
}

export interface Ticket {
  id: string;
  subject: string;
  content: string;
  company: string;
  category: CategoryData | string | null; // Hỗ trợ cả format cũ và mới
  pipelineStage: string;
  createDate: string;
  owner?: string;
  sourceType?: string;
  supportObject?: string;
}

// Helper function để chuyển đổi categories
export function formatCategoryData(categories: string[]): CategoryData {
  return {
    values: categories,
    primary: categories[0] || null,
    count: categories.length
  };
}

// Helper function để lấy danh sách categories từ JSON
export function getCategoryValues(category: CategoryData | string | null): string[] {
  if (!category) return [];
  if (typeof category === 'string') return [category];
  if (category.values && Array.isArray(category.values)) return category.values;
  return [];
}

export interface Report {
  id: string;
  ticketIds: string[];
  content: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  prompt: string;
  type: 'day' | 'week' | 'month' | 'custom';
}

export interface Prompt {
  id: string;
  prompt: string;
}

export interface CronLog {
  id: string;
  task: string;
  status: 'success' | 'failed';
  message?: string;
  createdAt: string;
}

// Thay thế any bằng specific types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}