'use client';

import { Icon } from '@iconify/react';

interface Ticket {
  id: string;
  subject: string;
  content: string;
  company: string;
  category: any; // Thay đổi từ string thành any để hỗ trợ JSON
  pipelineStage: string;
  createDate: string;
  owner?: string;
}

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Component modal hiển thị chi tiết ticket
 */
/**
 * Hàm helper để hiển thị categories từ JSON với format mới
 * @param category - Dữ liệu category với format {count, ids, label}
 * @returns JSX Element hiển thị các category badges
 */
function displayCategories(category: any): JSX.Element {
  if (!category) {
    return <span className="badge badge-outline badge-lg rounded-xl">N/A</span>;
  }
  
  // Nếu category là string (dữ liệu cũ)
  if (typeof category === 'string') {
    return <span className="badge badge-outline badge-lg rounded-xl">{category}</span>;
  }
  
  // Nếu category là object với format mới {count, ids, label}
  if (category.label && Array.isArray(category.label)) {
    return (
      <div className="flex flex-wrap gap-2">
        {category.label.map((cat: string, index: number) => (
          <span 
            key={index} 
            className={`badge badge-lg rounded-xl ${
              index === 0 ? 'badge-primary' : 'badge-outline'
            }`}
            title={category.ids && category.ids[index] ? `ID: ${category.ids[index]}` : ''}
          >
            {cat}
            {index === 0 && category.count > 1 && (
              <span className="ml-1 text-xs opacity-70">(Chính)</span>
            )}
          </span>
        ))}
        {category.count > 0 && (
          <div className="text-xs text-base-content/60 mt-1">
            Tổng: {category.count} danh mục
          </div>
        )}
      </div>
    );
  }
  
  // Fallback cho format cũ (values)
  if (category.values && Array.isArray(category.values)) {
    return (
      <div className="flex flex-wrap gap-2">
        {category.values.map((cat: string, index: number) => (
          <span 
            key={index} 
            className={`badge badge-lg rounded-xl ${
              index === 0 ? 'badge-primary' : 'badge-outline'
            }`}
          >
            {cat}
            {index === 0 && category.values.length > 1 && (
              <span className="ml-1 text-xs opacity-70">(Chính)</span>
            )}
          </span>
        ))}
      </div>
    );
  }
  
  return <span className="badge badge-outline badge-lg rounded-xl">N/A</span>;
}

export default function TicketDetailModal({ ticket, isOpen, onClose }: TicketDetailModalProps) {
  if (!ticket || !isOpen) return null;

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
   * Format ngày giờ đầy đủ
   */
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-5xl rounded-3xl shadow-2xl border border-base-200/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-info to-info/80 rounded-xl flex items-center justify-center">
              <Icon icon="solar:ticket-bold-duotone" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-base-content">Chi tiết Ticket</h3>
              <p className="text-base-content/60">Thông tin đầy đủ của ticket</p>
            </div>
          </div>
          <button 
            className="btn btn-ghost btn-sm rounded-xl hover:bg-error/10 text-error hover:text-error transition-all duration-300"
            onClick={onClose}
          >
            <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cột trái - Thông tin cơ bản */}
          <div className="space-y-6">
            <div className="card bg-base-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Icon icon="solar:info-circle-bold-duotone" className="w-5 h-5 text-primary" />
                Thông tin cơ bản
              </h4>
              
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/80">
                      <Icon icon="solar:hashtag-bold-duotone" className="w-4 h-4 inline mr-2" />
                      ID Ticket
                    </span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered rounded-xl bg-base-200/50" 
                    value={ticket.id} 
                    readOnly 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/80">
                      <Icon icon="solar:buildings-bold-duotone" className="w-4 h-4 inline mr-2" />
                      Công ty
                    </span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered rounded-xl bg-base-200/50" 
                    value={ticket.company} 
                    readOnly 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/80">
                      <Icon icon="solar:user-bold-duotone" className="w-4 h-4 inline mr-2" />
                      Nhân viên phụ trách
                    </span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered rounded-xl bg-base-200/50" 
                    value={getUserName(ticket.owner)} 
                    readOnly 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/80">
                      <Icon icon="solar:shield-check-bold-duotone" className="w-4 h-4 inline mr-2" />
                      Trạng thái
                    </span>
                  </label>
                  <div className="pt-2">
                    <div className={`badge ${getStatusBadge(ticket.pipelineStage)} badge-lg rounded-xl w-full justify-center py-3`}>
                      {ticket.pipelineStage}
                    </div>
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/80">
                      <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4 inline mr-2" />
                      Ngày tạo
                    </span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered rounded-xl bg-base-200/50" 
                    value={formatDateTime(ticket.createDate)} 
                    readOnly 
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Cột phải - Nội dung */}
          <div className="space-y-6">
            <div className="card bg-base-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-secondary" />
                Nội dung ticket
              </h4>
              
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/80">
                      <Icon icon="solar:text-bold-duotone" className="w-4 h-4 inline mr-2" />
                      Tiêu đề
                    </span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered rounded-xl bg-base-200/50" 
                    value={ticket.subject} 
                    readOnly 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/80">
                      <Icon icon="solar:document-bold-duotone" className="w-4 h-4 inline mr-2" />
                      Nội dung chi tiết
                    </span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered rounded-xl bg-base-200/50 min-h-[200px]" 
                    value={ticket.content} 
                    readOnly 
                  />
                </div>
                
                {/* Di chuyển phần danh mục xuống đây */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/80">
                      <Icon icon="solar:folder-bold-duotone" className="w-4 h-4 inline mr-2" />
                      Danh mục
                    </span>
                  </label>
                  <div className="space-y-2">
                    {displayCategories(ticket.category)}
                    
                    {/* Hiển thị thông tin chi tiết category nếu có */}
                    {ticket.category && typeof ticket.category === 'object' && ticket.category.ids && (
                      <div className="bg-base-200/30 rounded-xl p-3 mt-2">
                        <div className="text-xs text-base-content/60 space-y-1">
                          <div className="font-medium">Chi tiết danh mục:</div>
                          {ticket.category.ids.map((id: string, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span>ID: {id}</span>
                              <span>{ticket.category.label[index]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}