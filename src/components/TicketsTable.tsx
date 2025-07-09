'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import TicketDetailModal from './TicketDetailModal';

interface Ticket {
  id: string;
  subject: string;
  content: string;
  company: string;
  category: any; // Thay đổi từ string thành any để hỗ trợ object
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

interface TicketsTableProps {
  tickets: Ticket[];
  loading: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

/**
 * Hàm helper để hiển thị category từ object hoặc string với format JSON mới
 * @param category - Dữ liệu category có thể là string hoặc object với format mới
 * @returns Chuỗi hiển thị category
 */
function displayCategory(category: any): string {
  if (!category) return 'N/A';
  
  // Nếu category là string (dữ liệu cũ)
  if (typeof category === 'string') {
    return category || 'N/A';
  }
  
  // Nếu category là object với format mới {count, ids, label}
  if (category.label && Array.isArray(category.label)) {
    if (category.count === 1) {
      return category.label[0] || 'N/A';
    } else if (category.count > 1) {
      return `${category.label[0]} (+${category.count - 1} more)`;
    }
  }
  
  // Fallback cho format cũ (primary, values)
  if (category.primary) {
    return category.count > 1 
      ? `${category.primary} (+${category.count - 1} more)`
      : category.primary;
  }
  
  // Fallback cho các trường hợp khác
  if (category.values && Array.isArray(category.values) && category.values.length > 0) {
    return category.values.length > 1
      ? `${category.values[0]} (+${category.values.length - 1} more)`
      : category.values[0];
  }
  
  return 'N/A';
}

/**
 * Component hiển thị bảng tickets với modal chi tiết
 */
export default function TicketsTable({ 
  tickets = [], // Default empty array
  loading = false, 
  pagination = { page: 1, limit: 10, total: 0, totalPages: 0 }, // Default pagination
  onPageChange, 
  onLimitChange 
}: TicketsTableProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  /**
   * Lấy màu badge theo trạng thái
   */
  const getStatusBadge = (stage: string) => {
    const statusMap: Record<string, string> = {
      'new': 'badge-primary',
      'in_progress': 'badge-warning', 
      'resolved': 'badge-success',
      'closed': 'badge-neutral'
    };
    return statusMap[stage] || 'badge-ghost';
  };
  
  /**
   * Lấy tên nhân viên phụ trách từ database
   */
  const getUserName = (owner?: string) => {
    // Trường owner trong database đã chứa tên đầy đủ từ HubSpot
    return owner || 'Chưa phân công';
  };
  
  /**
   * Mở modal chi tiết ticket
   */
  const openTicketDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };
  
  /**
   * Đóng modal chi tiết
   */
  const closeTicketDetail = () => {
    setSelectedTicket(null);
    setIsModalOpen(false);
  };
  
  return (
    <>
      {/* Tickets Table */}
      <div className="card bg-base-100 shadow-2xl rounded-3xl border border-base-200/50">
        <div className="card-body p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-info to-info/80 rounded-xl flex items-center justify-center">
                <Icon icon="solar:list-bold-duotone" className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="card-title text-2xl font-bold text-base-content">
                  Danh sách Tickets ({pagination.total})
                </h2>
                <p className="text-base-content/60">Tất cả tickets trong hệ thống</p>
              </div>
            </div>
            <div className="form-control">
              <select 
                className="select select-bordered select-sm rounded-xl focus:border-primary transition-all duration-300"
                value={pagination.limit}
                onChange={(e) => onLimitChange(parseInt(e.target.value))}
              >
                <option value={10}>10 / trang</option>
                <option value={25}>25 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-base-content/60 text-lg">Đang tải dữ liệu tickets...</p>
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-base-200 to-base-300 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <Icon icon="solar:inbox-bold-duotone" className="w-12 h-12 text-base-content/30" />
              </div>
              <h3 className="text-xl font-bold text-base-content mb-2">Không có tickets</h3>
              <p className="text-base-content/60 mb-6">Không tìm thấy tickets nào phù hợp với bộ lọc hiện tại</p>
            </div>
          ) : (
            <>
              {/* Table với thiết kế card đẹp */}
              <div className="bg-base-50 rounded-2xl p-1 shadow-inner">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-none">
                        <th className="rounded-l-2xl py-4 px-6 font-bold text-base-content/80">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:hashtag-bold-duotone" className="w-4 h-4 text-primary" />
                            ID
                          </div>
                        </th>
                        <th className="py-4 px-6 font-bold text-base-content/80">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:document-text-bold-duotone" className="w-4 h-4 text-secondary" />
                            Tiêu đề / Nội dung
                          </div>
                        </th>
                        <th className="py-4 px-6 font-bold text-base-content/80">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:user-bold-duotone" className="w-4 h-4 text-accent" />
                            Nhân viên
                          </div>
                        </th>
                        <th className="py-4 px-6 font-bold text-base-content/80">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:bookmark-bold-duotone" className="w-4 h-4 text-warning" />
                            Danh mục
                          </div>
                        </th>
                        <th className="py-4 px-6 font-bold text-base-content/80">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:shield-check-bold-duotone" className="w-4 h-4 text-success" />
                            Trạng thái
                          </div>
                        </th>
                        <th className="rounded-r-2xl py-4 px-6 font-bold text-base-content/80">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4 text-info" />
                            Ngày tạo
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr 
                          key={ticket.id} 
                          className="hover:bg-base-200/50 transition-all duration-300 border-none group cursor-pointer"
                          onClick={() => openTicketDetail(ticket)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon icon="solar:hashtag-bold" className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-mono text-sm font-medium">
                                {ticket.id.slice(0, 8)}...
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="max-w-md">
                              <div className="font-semibold text-base-content mb-1 truncate">
                                {ticket.subject}
                              </div>
                              <div className="text-sm text-base-content/70 line-clamp-2">
                                {ticket.content}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                <Icon icon="solar:user-bold" className="w-4 h-4 text-accent" />
                              </div>
                              <span className="font-medium">{getUserName(ticket.owner)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Icon icon="solar:bookmark-bold" className="w-4 h-4 text-warning" />
                              </div>
                              <span className="font-medium text-sm">
                                {displayCategory(ticket.category)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`badge ${getStatusBadge(ticket.pipelineStage)} badge-lg rounded-xl font-medium`}>
                              {ticket.pipelineStage}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Icon icon="solar:calendar-bold" className="w-4 h-4 text-info" />
                              <div className="text-sm">
                                <div className="font-medium">
                                  {new Date(ticket.createDate).toLocaleDateString('vi-VN')}
                                </div>
                                <div className="text-base-content/60">
                                  {new Date(ticket.createDate).toLocaleTimeString('vi-VN')}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="card bg-gradient-to-r from-base-100 to-base-200/50 rounded-2xl shadow-lg mt-6">
                  <div className="card-body p-6">
                    <div className="flex justify-center">
                      <div className="join shadow-lg">
                        <button 
                          className="join-item btn rounded-l-xl hover:bg-primary/10 transition-all duration-300"
                          disabled={pagination.page === 1}
                          onClick={() => onPageChange(pagination.page - 1)}
                        >
                          <Icon icon="solar:arrow-left-bold" className="w-4 h-4" />
                        </button>
                        
                        {(() => {
                          const maxVisiblePages = 5;
                          const totalPages = pagination.totalPages || 1;
                          const currentPage = pagination.page || 1;
                          
                          // Tính toán range an toàn
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                          
                          // Điều chỉnh startPage nếu endPage đã chạm giới hạn
                          if (endPage - startPage + 1 < maxVisiblePages) {
                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                          }
                          
                          // Tạo mảng pages an toàn
                          const pages = [];
                          for (let i = startPage; i <= endPage && i <= totalPages; i++) {
                            pages.push(i);
                          }
                          
                          return pages.map(page => (
                            <button 
                              key={page}
                              className={`join-item btn transition-all duration-300 ${
                                currentPage === page 
                                  ? 'btn-primary shadow-lg' 
                                  : 'hover:bg-primary/10'
                              }`}
                              onClick={() => onPageChange(page)}
                            >
                              {page}
                            </button>
                          ));
                        })()}
                        
                        <button 
                          className="join-item btn rounded-r-xl hover:bg-primary/10 transition-all duration-300"
                          disabled={pagination.page === pagination.totalPages}
                          onClick={() => onPageChange(pagination.page + 1)}
                        >
                          <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-center mt-4">
                      <p className="text-sm text-base-content/60">
                        Hiển thị trang {pagination.page} / {pagination.totalPages} 
                        ({pagination.total} tickets)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Ticket Detail Modal */}
      <TicketDetailModal 
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={closeTicketDetail}
      />
    </>
  );
}