'use client';
import { Icon } from '@iconify/react';

/**
 * Interface cho SyncLog
 */
interface SyncLog {
  id: string;
  syncType: string;
  range: string;
  totalFetched: number;
  totalSaved: number;
  startDate: string;
  endDate: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

/**
 * Props cho SyncDetailModal component
 */
interface SyncDetailModalProps {
  isOpen: boolean;
  selectedLog: SyncLog | null;
  onClose: () => void;
}

/**
 * Component modal hiển thị chi tiết lịch sử đồng bộ
 * @param isOpen - Trạng thái mở/đóng modal
 * @param selectedLog - Log đồng bộ được chọn
 * @param onClose - Function đóng modal
 * @returns JSX Element modal chi tiết
 */
export default function SyncDetailModal({ isOpen, selectedLog, onClose }: SyncDetailModalProps) {
  /**
   * Format ngày tháng hiển thị
   * @param dateString - Chuỗi ngày tháng
   * @returns Chuỗi ngày tháng đã format
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * Lấy badge color cho range
   * @param range - Khoảng thời gian
   * @returns CSS class cho badge
   */
  const getRangeBadgeColor = (range: string) => {
    switch (range) {
      case '1d': return 'badge-primary';
      case '7d': return 'badge-secondary';
      case '30d': return 'badge-accent';
      case '6m': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };
  
  /**
   * Lấy text hiển thị cho range
   * @param range - Khoảng thời gian
   * @returns Text hiển thị
   */
  const getRangeText = (range: string) => {
    switch (range) {
      case '1d': return '1 ngày';
      case '7d': return '7 ngày';
      case '30d': return '30 ngày';
      case '6m': return '6 tháng';
      default: return range;
    }
  };
  
  /**
   * Tính toán thời gian xử lý
   * @param startDate - Ngày bắt đầu
   * @param endDate - Ngày kết thúc
   * @returns Thời gian xử lý
   */
  const calculateProcessingTime = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds} giây`;
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;
      return `${minutes}p ${seconds}s`;
    } else {
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      return `${hours}h ${minutes}p`;
    }
  };
  
  if (!isOpen || !selectedLog) return null;
  
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl bg-base-100 rounded-3xl shadow-2xl border border-base-200/50">
        {/* Header modal */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-base-200/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Icon icon="solar:document-text-bold-duotone" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-base-content">Chi tiết đồng bộ</h3>
              <p className="text-base-content/60">Thông tin chi tiết về lần đồng bộ</p>
            </div>
          </div>
          <button 
            className="btn btn-ghost btn-sm rounded-xl hover:bg-error/10 hover:text-error transition-all duration-300"
            onClick={onClose}
          >
            <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
          </button>
        </div>
        
        {/* Nội dung modal */}
        <div className="space-y-6">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Icon icon="solar:calendar-bold-duotone" className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg text-base-content">Thời gian</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-base-content/60">Bắt đầu:</span>
                    <p className="font-semibold text-base-content">{formatDate(selectedLog.startDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-base-content/60">Kết thúc:</span>
                    <p className="font-semibold text-base-content">{formatDate(selectedLog.endDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-base-content/60">Thời gian xử lý:</span>
                    <p className="font-semibold text-primary">{calculateProcessingTime(selectedLog.startDate, selectedLog.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20 rounded-2xl">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                    <Icon icon="solar:settings-bold-duotone" className="w-5 h-5 text-secondary" />
                  </div>
                  <h4 className="font-bold text-lg text-base-content">Cấu hình</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-base-content/60">Loại đồng bộ:</span>
                    <p className="font-semibold text-base-content">{selectedLog.syncType}</p>
                  </div>
                  <div>
                    <span className="text-sm text-base-content/60">Khoảng thời gian:</span>
                    <div className={`badge ${getRangeBadgeColor(selectedLog.range)} badge-lg rounded-xl font-medium mt-1`}>
                      <Icon icon="solar:clock-circle-bold" className="w-3 h-3 mr-1" />
                      {getRangeText(selectedLog.range)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-base-content/60">ID đồng bộ:</span>
                    <p className="font-mono text-sm text-base-content bg-base-200 px-2 py-1 rounded-lg">{selectedLog.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Thống kê chi tiết */}
          <div className="card bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 rounded-2xl">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Icon icon="solar:chart-bold-duotone" className="w-5 h-5 text-accent" />
                </div>
                <h4 className="font-bold text-lg text-base-content">Thống kê chi tiết</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stats shadow-lg bg-base-100 rounded-2xl">
                  <div className="stat p-4">
                    <div className="stat-figure">
                      <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                        <Icon icon="solar:download-bold-duotone" className="w-5 h-5 text-info" />
                      </div>
                    </div>
                    <div className="stat-title text-sm">Tickets lấy được</div>
                    <div className="stat-value text-2xl text-info">{selectedLog.totalFetched}</div>
                    <div className="stat-desc text-info">Từ HubSpot API</div>
                  </div>
                </div>
                
                <div className="stats shadow-lg bg-base-100 rounded-2xl">
                  <div className="stat p-4">
                    <div className="stat-figure">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <Icon icon="solar:database-bold-duotone" className="w-5 h-5 text-success" />
                      </div>
                    </div>
                    <div className="stat-title text-sm">Tickets đã lưu</div>
                    <div className="stat-value text-2xl text-success">{selectedLog.totalSaved}</div>
                    <div className="stat-desc text-success">Vào database</div>
                  </div>
                </div>
                
                <div className="stats shadow-lg bg-base-100 rounded-2xl">
                  <div className="stat p-4">
                    <div className="stat-figure">
                      <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                        <Icon icon="solar:percent-bold-duotone" className="w-5 h-5 text-warning" />
                      </div>
                    </div>
                    <div className="stat-title text-sm">Tỷ lệ thành công</div>
                    <div className="stat-value text-2xl text-warning">
                      {selectedLog.totalFetched > 0 
                        ? Math.round((selectedLog.totalSaved / selectedLog.totalFetched) * 100)
                        : 0}%
                    </div>
                    <div className="stat-desc text-warning">Hiệu quả đồng bộ</div>
                  </div>
                </div>
              </div>
              
              {/* Progress bar chi tiết */}
              {selectedLog.totalFetched > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-base-content/70">Tiến độ đồng bộ</span>
                    <span className="text-sm font-bold text-accent">
                      {selectedLog.totalSaved} / {selectedLog.totalFetched}
                    </span>
                  </div>
                  <div className="w-full bg-base-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-success via-accent to-success h-4 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                      style={{ width: `${Math.round((selectedLog.totalSaved / selectedLog.totalFetched) * 100)}%` }}
                    >
                      <span className="text-xs font-bold text-white">
                        {Math.round((selectedLog.totalSaved / selectedLog.totalFetched) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Trạng thái và lỗi */}
          <div className="card bg-gradient-to-br from-base-100 to-base-50 border border-base-200/50 rounded-2xl">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-info/20 rounded-xl flex items-center justify-center">
                  <Icon icon="solar:shield-check-bold-duotone" className="w-5 h-5 text-info" />
                </div>
                <h4 className="font-bold text-lg text-base-content">Trạng thái & Kết quả</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-base-content/60 min-w-fit">Trạng thái:</span>
                  <div className={`badge badge-lg rounded-xl font-medium shadow-sm ${
                    selectedLog.status === 'completed' 
                      ? 'badge-success' 
                      : 'badge-error'
                  }`}>
                    <Icon 
                      icon={selectedLog.status === 'completed' 
                        ? 'solar:check-circle-bold' 
                        : 'solar:close-circle-bold'
                      } 
                      className="w-4 h-4 mr-2" 
                    />
                    {selectedLog.status === 'completed' ? 'Hoàn thành thành công' : 'Thất bại'}
                  </div>
                </div>
                
                {selectedLog.errorMessage && (
                  <div className="alert alert-error rounded-2xl">
                    <Icon icon="solar:danger-bold" className="w-5 h-5" />
                    <div>
                      <h4 className="font-bold">Lỗi xảy ra:</h4>
                      <p className="text-sm">{selectedLog.errorMessage}</p>
                    </div>
                  </div>
                )}
                
                {selectedLog.status === 'completed' && (
                  <div className="alert alert-success rounded-2xl">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
                    <div>
                      <h4 className="font-bold">Đồng bộ thành công!</h4>
                      <p className="text-sm">
                        Đã đồng bộ thành công {selectedLog.totalSaved} tickets từ tổng số {selectedLog.totalFetched} tickets được lấy từ HubSpot.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer modal */}
        <div className="modal-action mt-8 pt-6 border-t border-base-200/50">
          <button 
            className="btn btn-primary rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={onClose}
          >
            <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
            Đóng
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}