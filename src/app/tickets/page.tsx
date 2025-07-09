'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import TicketsTable from '@/components/TicketsTable';

// Thêm interfaces
interface Ticket {
  id: string;
  subject: string;
  content: string;
  company: string;
  category: string;
  pipelineStage: string;
  createDate: string;
  owner?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Sửa interface TicketsResponse
interface TicketsResponse {
  success: boolean;
  data: {
    tickets: Ticket[];
    pagination: PaginationInfo;
  };
  message?: string;
}

// Thêm interface cho filter options
interface FilterOptions {
  owners: string[];
  categories: string[];
}

interface FilterOptionsResponse {
  success: boolean;
  data: FilterOptions;
  message?: string;
}

interface Filters {
  search: string;
  category: string;
  owner: string;
  startDate: string;
  endDate: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  // Thêm state cho error handling
  const [error, setError] = useState<string | null>(null);
  // Thêm state cho filter options với default values an toàn
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    owners: [],
    categories: []
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    owner: '',
    startDate: '',
    endDate: ''
  });
  
  /**
   * Lấy danh sách filter options từ API
   */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/tickets/filters');
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status}`);
      }
      
      const result: FilterOptionsResponse = await response.json();
      if (result.success && result.data) {
        // Đảm bảo data có cấu trúc đúng
        setFilterOptions({
          owners: result.data.owners || [],
          categories: result.data.categories || []
        });
      }
    } catch (error) {
      console.error('Lỗi lấy filter options:', error);
      // Giữ nguyên state mặc định nếu có lỗi
      setFilterOptions({
        owners: [],
        categories: []
      });
    }
  }, []);
  
  /**
   * Lấy danh sách tickets từ API với error handling tốt hơn
   */
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });
      
      const response = await fetch(`/api/tickets?${params}`);
      
      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status}`);
      }
      
      const result: TicketsResponse = await response.json();
      
      if (result.success && result.data) {
        setTickets(result.data.tickets);
        setPagination(prev => ({ ...prev, ...result.data.pagination }));
      } else {
        throw new Error(result.message || 'Không thể lấy dữ liệu tickets');
      }
    } catch (error) {
      console.error('Lỗi lấy tickets:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra');
      setTickets([]);
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, filters]);
  
  // Load filter options khi component mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);
  
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);
  
  /**
   * Xử lý thay đổi filter
   */
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  /**
   * Đóng thông báo lỗi
   */
  const closeError = () => {
    setError(null);
  };
  
  /**
   * Xử lý thay đổi trang
   */
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };
  
  /**
   * Xử lý thay đổi số lượng item per page
   */
  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };
  
  return (
    <div className="space-y-8">
      {/* Header với gradient đẹp */}
      <div className="hero bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl p-8">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Icon icon="solar:ticket-bold-duotone" className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Quản lý Tickets
            </h1>
            <p className="text-base-content/70 text-lg">
              Xem và quản lý tất cả tickets từ HubSpot với AI thông minh
            </p>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="card bg-base-100 shadow-2xl rounded-3xl border border-error/20">
          <div className="card-body p-6">
            <div className="alert alert-error rounded-2xl shadow-lg">
              <Icon icon="solar:danger-bold" className="w-6 h-6" />
              <div className="flex-1">
                <h3 className="font-bold text-lg">Có lỗi xảy ra!</h3>
                <div className="text-sm opacity-80">{error}</div>
              </div>
              <button 
                className="btn btn-ghost btn-sm rounded-xl hover:bg-error/10 transition-all duration-300"
                onClick={closeError}
              >
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="card bg-base-100 shadow-2xl rounded-3xl border border-base-200/50">
        <div className="card-body p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Icon icon="solar:filter-bold-duotone" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="card-title text-2xl font-bold text-base-content">Bộ lọc tìm kiếm</h2>
              <p className="text-base-content/60">Tìm kiếm và lọc tickets theo tiêu chí</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">
                  <Icon icon="solar:magnifer-bold-duotone" className="w-4 h-4 inline mr-2" />
                  Tìm kiếm
                </span>
              </label>
              <input 
                type="text" 
                placeholder="Tìm theo tiêu đề, nội dung..." 
                className="input input-bordered rounded-xl focus:border-primary transition-all duration-300"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">
                  <Icon icon="solar:folder-bold-duotone" className="w-4 h-4 inline mr-2" />
                  Danh mục
                </span>
              </label>
              <select 
                className="select select-bordered rounded-xl focus:border-primary transition-all duration-300"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {(filterOptions?.categories || []).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">
                  <Icon icon="solar:user-bold-duotone" className="w-4 h-4 inline mr-2" />
                  Người xử lý
                </span>
              </label>
              <select 
                className="select select-bordered rounded-xl focus:border-primary transition-all duration-300"
                value={filters.owner}
                onChange={(e) => handleFilterChange('owner', e.target.value)}
              >
                <option value="">Tất cả người xử lý</option>
                {(filterOptions?.owners || []).map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">
                  <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4 inline mr-2" />
                  Từ ngày
                </span>
              </label>
              <input 
                type="date" 
                className="input input-bordered rounded-xl focus:border-primary transition-all duration-300"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">
                  <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4 inline mr-2" />
                  Đến ngày
                </span>
              </label>
              <input 
                type="date" 
                className="input input-bordered rounded-xl focus:border-primary transition-all duration-300"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6 gap-4">
            <button 
              className="btn btn-ghost rounded-xl hover:bg-base-200 transition-all duration-300"
              onClick={() => {
                setFilters({
                  search: '',
                  category: '',
                  owner: '',
                  startDate: '',
                  endDate: ''
                });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <Icon icon="solar:refresh-bold" className="w-5 h-5" />
              Xóa bộ lọc
            </button>
            <button 
              className="btn btn-primary rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={fetchTickets}
            >
              <Icon icon="solar:magnifer-bold" className="w-5 h-5" />
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>
      
      {/* Tickets Table Component */}
      <TicketsTable 
        tickets={tickets}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}