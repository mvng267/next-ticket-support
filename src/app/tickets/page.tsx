'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Ticket } from '@/types/ticket';

/**
 * Interface cho response API
 */
interface TicketsResponse {
  success: boolean;
  data: {
    tickets: Ticket[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: {
      startDate?: string;
      endDate?: string;
      search?: string;
    };
  };
}

/**
 * Component Modal hiển thị chi tiết ticket
 */
function TicketDetailModal({ ticket, isOpen, onClose }: { 
  ticket: Ticket | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!isOpen || !ticket) return null;

  /**
   * Format ngày tháng chi tiết
   */
  const formatDetailDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Icon icon="solar:ticket-bold" className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Chi tiết Ticket
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Icon icon="solar:close-bold" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột trái */}
            <div className="space-y-4">
              {/* Thông tin cơ bản */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-blue-600" />
                  Thông tin cơ bản
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Ticket</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                      {ticket.id}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                    <p className="mt-1 text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                      {ticket.subject || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Công ty</label>
                    <p className="mt-1 text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                      {ticket.company_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nguồn</label>
                    <p className="mt-1 text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                      {ticket.source_type || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phân loại */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Icon icon="solar:tag-bold" className="w-5 h-5 text-green-600" />
                  Phân loại
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {ticket.category_label || ticket.category_value || 'N/A'}
                      </span>
                      {ticket.category_value && ticket.category_label && (
                        <span className="text-xs text-gray-500">({ticket.category_value})</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trạng thái Pipeline</label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {ticket.pipeline_stage_label || ticket.pipeline_stage_value || 'N/A'}
                      </span>
                      {ticket.pipeline_stage_value && ticket.pipeline_stage_label && (
                        <span className="text-xs text-gray-500">({ticket.pipeline_stage_value})</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Đối tượng hỗ trợ</label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        {ticket.support_object_label || ticket.support_object_value || 'N/A'}
                      </span>
                      {ticket.support_object_value && ticket.support_object_label && (
                        <span className="text-xs text-gray-500">({ticket.support_object_value})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải */}
            <div className="space-y-4">
              {/* Người phụ trách */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Icon icon="solar:user-bold" className="w-5 h-5 text-indigo-600" />
                  Người phụ trách
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tên</label>
                    <p className="mt-1 text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                      {ticket.owner_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Owner</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                      {ticket.owner_id || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thời gian */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Icon icon="solar:calendar-bold" className="w-5 h-5 text-red-600" />
                  Thời gian
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                    <p className="mt-1 text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                      {formatDetailDate(ticket.created_date)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Đồng bộ lần cuối</label>
                    <p className="mt-1 text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                      {formatDetailDate(ticket.synced_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nội dung */}
          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Icon icon="solar:document-text-bold" className="w-5 h-5 text-yellow-600" />
                Nội dung
              </h3>
              <div className="bg-white rounded border p-4 max-h-60 overflow-y-auto">
                {ticket.content ? (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {ticket.content}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Không có nội dung
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Icon icon="solar:close-bold" className="w-4 h-4" />
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Component trang danh sách tickets
 */
export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Filters state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    search: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Xử lý click vào ticket để mở modal
   */
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  /**
   * Đóng modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  /**
   * Lấy dữ liệu tickets từ API
   */
  const fetchTickets = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`/api/tickets?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TicketsResponse = await response.json();
      
      if (data.success) {
        setTickets(data.data.tickets);
        setPagination(data.data.pagination);
        setCurrentPage(page);
      } else {
        throw new Error('API returned error');
      }
      
    } catch (err) {
      console.error('Lỗi khi lấy tickets:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xử lý thay đổi filter
   */
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Áp dụng filter
   */
  const applyFilters = () => {
    setCurrentPage(1);
    fetchTickets(1);
  };

  /**
   * Reset filter
   */
  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', search: '' });
    setCurrentPage(1);
    fetchTickets(1);
  };

  /**
   * Format ngày tháng
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Truncate text
   */
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Icon icon="solar:ticket-bold" className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Danh sách Tickets
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Tổng: {pagination.totalItems} tickets
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="solar:filter-bold" className="w-5 h-5 text-blue-600" />
            Bộ lọc
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Ngày bắt đầu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Ngày kết thúc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Tìm kiếm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, công ty, nội dung..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Icon icon="solar:magnifer-bold" className="w-4 h-4" />
                Lọc
              </button>
              <button
                onClick={resetFilters}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Icon icon="solar:refresh-bold" className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Icon icon="solar:loading-bold" className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Lỗi:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Tickets Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiêu đề
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Công ty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người phụ trách
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          <div className="font-medium">{truncateText(ticket.subject, 40)}</div>
                          {ticket.content && (
                            <div className="text-gray-500 text-xs mt-1">
                              {truncateText(ticket.content, 60)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.company_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.owner_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {ticket.pipeline_stage_label || ticket.pipeline_stage_value || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(ticket.created_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleTicketClick(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {truncateText(ticket.subject, 30)}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        ID: {ticket.id}
                      </p>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>Công ty: {ticket.company_name || 'N/A'}</div>
                        <div>Người phụ trách: {ticket.owner_name || 'N/A'}</div>
                        <div>Ngày tạo: {formatDate(ticket.created_date)}</div>
                      </div>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 ml-2">
                      {ticket.pipeline_stage_label || ticket.pipeline_stage_value || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {tickets.length === 0 && (
              <div className="text-center py-12">
                <Icon icon="solar:ticket-bold" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có tickets</h3>
                <p className="text-gray-500">Không tìm thấy tickets nào với bộ lọc hiện tại.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && tickets.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {((currentPage - 1) * pagination.itemsPerPage) + 1} đến{' '}
                {Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)} trong tổng số{' '}
                {pagination.totalItems} tickets
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchTickets(currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md">
                  {currentPage} / {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => fetchTickets(currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      <TicketDetailModal 
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}