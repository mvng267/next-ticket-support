'use client';
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import SyncDetailModal from '@/components/SyncDetailModal';



/**
 * Trang đồng bộ tickets từ HubSpot với giao diện DaisyUI bo tròn đẹp
 * @returns JSX Element trang sync với các options thời gian
 */
// Thêm interfaces
interface SyncResult {
  success: boolean;
  message: string;
  data?: unknown[];
}

interface SyncOption {
  range: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
}

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

interface SyncLogsResponse {
  success: boolean;
  data: SyncLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SyncStats {
  totalSyncs: number;
  totalFetched: number;
  totalSaved: number;
}

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>('');
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  
  // State cho modal
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const syncOptions: SyncOption[] = [
    {
      range: '1d',
      title: '1 Ngày',
      description: 'Đồng bộ tickets trong 24 giờ qua',
      icon: 'solar:calendar-bold-duotone',
      color: 'btn-primary',
      bgGradient: 'from-primary/5 to-primary/10',
      borderColor: 'border-primary/20'
    },
    {
      range: '7d',
      title: '7 Ngày',
      description: 'Đồng bộ tickets trong 1 tuần qua',
      icon: 'solar:calendar-bold-duotone',
      color: 'btn-secondary',
      bgGradient: 'from-secondary/5 to-secondary/10',
      borderColor: 'border-secondary/20'
    },
    {
      range: '30d',
      title: '30 Ngày',
      description: 'Đồng bộ tickets trong 1 tháng qua',
      icon: 'solar:calendar-bold-duotone',
      color: 'btn-accent',
      bgGradient: 'from-accent/5 to-accent/10',
      borderColor: 'border-accent/20'
    },
    {
      range: '6m',
      title: '6 Tháng',
      description: 'Đồng bộ tickets trong 6 tháng qua',
      icon: 'solar:calendar-bold-duotone',
      color: 'btn-warning',
      bgGradient: 'from-warning/5 to-warning/10',
      borderColor: 'border-warning/20'
    }
  ];
  
  /**
   * Lấy lịch sử đồng bộ từ API
   * @param page - Trang hiện tại
   */
  const fetchSyncLogs = async (page: number = 1) => {
    try {
      setLogsLoading(true);
      const response = await fetch(`/api/sync-logs?page=${page}&limit=10`);
      const result: SyncLogsResponse & { stats: SyncStats } = await response.json();
      
      if (result.success) {
        setSyncLogs(result.data);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setSyncStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };
  
  /**
   * Load lịch sử đồng bộ khi component mount
   */
  useEffect(() => {
    fetchSyncLogs();
  }, []);
  
  /**
   * Thực hiện đồng bộ tickets từ HubSpot
   * @param range - Khoảng thời gian đồng bộ
   */
  const handleSync = async (range: string) => {
    setLoading(true);
    setSelectedRange(range);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/hubspot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ range })
      });
      
      const result: SyncResult = await response.json();
      setSyncResult(result);
      
      // Refresh lịch sử đồng bộ sau khi sync xong
      if (result.success) {
        await fetchSyncLogs();
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({
        success: false,
        message: 'Lỗi kết nối đến server'
      });
    }
    
    setLoading(false);
    setSelectedRange('');
  };
  
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
 * Mở modal chi tiết lịch sử đồng bộ
 * @param log - Log đồng bộ được chọn
 */
const openDetailModal = (log: SyncLog) => {
  setSelectedLog(log);
  setIsModalOpen(true);
};

/**
 * Đóng modal chi tiết
 */
const closeDetailModal = () => {
  setSelectedLog(null);
  setIsModalOpen(false);
};

  return (
    <div className="space-y-8">
      {/* Header với gradient đẹp */}
      <div className="hero bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl p-8">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Icon icon="solar:refresh-bold-duotone" className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Đồng bộ HubSpot
            </h1>
            <p className="text-base-content/70 text-lg">
              Đồng bộ tickets từ HubSpot theo khoảng thời gian với AI thông minh
            </p>
          </div>
        </div>
      </div>
      
      {/* Sync Options với design mới */}
      <div className="card bg-base-100 shadow-2xl rounded-3xl border border-base-200/50">
        <div className="card-body p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Icon icon="solar:refresh-bold-duotone" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="card-title text-2xl font-bold text-base-content">Chọn khoảng thời gian đồng bộ</h2>
              <p className="text-base-content/60">Lựa chọn phạm vi thời gian để đồng bộ dữ liệu</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {syncOptions.map((option) => (
              <div key={option.range} className={`card bg-gradient-to-br ${option.bgGradient} border ${option.borderColor} rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                <div className="card-body p-6 text-center">
                  <div className="w-12 h-12 mx-auto bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon icon={option.icon} className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="card-title justify-center text-lg mb-2">{option.title}</h3>
                  <p className="text-sm text-base-content/70 mb-4">{option.description}</p>
                  <button 
                    className={`btn ${option.color} rounded-xl w-full shadow-lg hover:shadow-xl transition-all`}
                    onClick={() => handleSync(option.range)}
                    disabled={loading}
                  >
                    {loading && selectedRange === option.range ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Đang đồng bộ...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:download-bold" className="w-5 h-5" />
                        Đồng bộ ngay
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Sync Result */}
      {syncResult && (
        <div className="card bg-base-100 shadow-2xl rounded-3xl border border-base-200/50">
          <div className="card-body p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-info to-info/80 rounded-xl flex items-center justify-center">
                  <Icon icon="solar:clipboard-list-bold-duotone" className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="card-title text-2xl font-bold text-base-content">Kết quả đồng bộ</h2>
                  <p className="text-base-content/60">Chi tiết quá trình đồng bộ vừa thực hiện</p>
                </div>
              </div>
              <button 
                className="btn btn-ghost btn-sm rounded-xl hover:bg-error/10 text-error hover:text-error transition-all duration-300"
                onClick={() => setSyncResult(null)}
                title="Đóng kết quả"
              >
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`alert rounded-2xl ${syncResult.success ? 'alert-success' : 'alert-error'} shadow-lg`}>
              <Icon 
                icon={syncResult.success ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} 
                className="w-6 h-6" 
              />
              <div>
                <h3 className="font-bold text-lg">
                  {syncResult.success ? 'Đồng bộ thành công!' : 'Đồng bộ thất bại!'}
                </h3>
                <div className="text-sm opacity-80">{syncResult.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sync Statistics */}
      {syncStats && (
        <div className="card bg-base-100 shadow-2xl rounded-3xl border border-base-200/50">
          <div className="card-body p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center">
                <Icon icon="solar:chart-bold-duotone" className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="card-title text-2xl font-bold text-base-content">Thống kê tổng quan</h2>
                <p className="text-base-content/60">Tổng hợp dữ liệu đồng bộ từ trước đến nay</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="stats shadow-xl bg-base-100 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="stat p-6">
                  <div className="stat-figure">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon icon="solar:refresh-bold-duotone" className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="stat-title text-base-content/60 font-medium">Tổng số lần đồng bộ</div>
                  <div className="stat-value text-2xl font-bold text-primary">{syncStats.totalSyncs}</div>
                  <div className="stat-desc font-medium text-success">Tất cả các lần đồng bộ</div>
                </div>
              </div>
              
              <div className="stats shadow-xl bg-base-100 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="stat p-6">
                  <div className="stat-figure">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Icon icon="solar:download-bold-duotone" className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                  <div className="stat-title text-base-content/60 font-medium">Tickets đã lấy</div>
                  <div className="stat-value text-2xl font-bold text-secondary">{syncStats.totalFetched.toLocaleString()}</div>
                  <div className="stat-desc font-medium text-info">Từ HubSpot API</div>
                </div>
              </div>
              
              <div className="stats shadow-xl bg-base-100 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="stat p-6">
                  <div className="stat-figure">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Icon icon="solar:database-bold-duotone" className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                  <div className="stat-title text-base-content/60 font-medium">Tickets đã lưu</div>
                  <div className="stat-value text-2xl font-bold text-accent">{syncStats.totalSaved.toLocaleString()}</div>
                  <div className="stat-desc font-medium text-info">Vào database</div>
                </div>
              </div>
              
              <div className="stats shadow-xl bg-base-100 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="stat p-6">
                  <div className="stat-figure">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <Icon icon="solar:check-circle-bold-duotone" className="w-6 h-6 text-success" />
                    </div>
                  </div>
                  <div className="stat-title text-base-content/60 font-medium">Tỷ lệ thành công</div>
                  <div className="stat-value text-2xl font-bold text-success">
                    {syncStats.totalFetched > 0 
                      ? Math.round((syncStats.totalSaved / syncStats.totalFetched) * 100)
                      : 0}%
                  </div>
                  <div className="stat-desc font-medium text-success">Hiệu quả đồng bộ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sync History */}
      <div className="card bg-base-100 shadow-2xl rounded-3xl border border-base-200/50">
        <div className="card-body p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-xl flex items-center justify-center">
                <Icon icon="solar:history-bold-duotone" className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="card-title text-2xl font-bold text-base-content">Lịch sử đồng bộ</h2>
                <p className="text-base-content/60">Theo dõi các lần đồng bộ đã thực hiện</p>
              </div>
            </div>
            <button 
              className="btn btn-ghost btn-sm rounded-xl hover:bg-primary/10 transition-all duration-300"
              onClick={() => fetchSyncLogs(currentPage)}
              disabled={logsLoading}
            >
              <Icon icon="solar:refresh-bold" className="w-4 h-4" />
              Làm mới
            </button>
          </div>
          
          {logsLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-base-content/60">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : syncLogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-base-200 to-base-300 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <Icon icon="solar:inbox-bold-duotone" className="w-12 h-12 text-base-content/30" />
              </div>
              <h3 className="text-xl font-bold text-base-content mb-2">Chưa có lịch sử đồng bộ</h3>
              <p className="text-base-content/60 mb-6">Thực hiện đồng bộ đầu tiên để xem lịch sử chi tiết</p>
              <button className="btn btn-primary rounded-xl shadow-lg">
                <Icon icon="solar:refresh-bold" className="w-5 h-5" />
                Bắt đầu đồng bộ
              </button>
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
                            <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4 text-primary" />
                            Thời gian
                          </div>
                        </th>
                        <th className="py-4 px-6 font-bold text-base-content/80">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:clock-circle-bold-duotone" className="w-4 h-4 text-secondary" />
                            Khoảng
                          </div>
                        </th>
                        <th className="py-4 px-6 font-bold text-base-content/80">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:ticket-bold-duotone" className="w-4 h-4 text-accent" />
                            Tickets
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
                            <Icon icon="solar:eye-bold-duotone" className="w-4 h-4 text-info" />
                            Chi tiết
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncLogs.map((log, index) => (
                        <tr 
                          key={log.id} 
                          className="hover:bg-base-200/50 transition-all duration-300 border-none group cursor-pointer"
                          onClick={() => openDetailModal(log)}
                        >
                          {/* Cột Thời gian */}
                          <td className="py-6 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Icon icon="solar:calendar-bold-duotone" className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold text-base-content">{formatDate(log.createdAt)}</div>
                                <div className="text-sm text-base-content/60">ID: {log.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Cột Khoảng */}
                          <td className="py-6 px-6">
                            <div className={`badge ${getRangeBadgeColor(log.range)} badge-lg rounded-xl font-medium shadow-sm`}>
                              <Icon icon="solar:clock-circle-bold" className="w-3 h-3 mr-1" />
                              {getRangeText(log.range)}
                            </div>
                          </td>
                          
                          {/* Cột Tickets */}
                          <td className="py-6 px-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:download-bold" className="w-4 h-4 text-info" />
                                <span className="text-sm text-base-content/70">Lấy được:</span>
                                <span className="font-bold text-info">{log.totalFetched}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:database-bold" className="w-4 h-4 text-success" />
                                <span className="text-sm text-base-content/70">Đã lưu:</span>
                                <span className="font-bold text-success">{log.totalSaved}</span>
                              </div>
                              {log.totalFetched > 0 && (
                                <div className="w-full bg-base-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-success to-accent h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.round((log.totalSaved / log.totalFetched) * 100)}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Cột Trạng thái */}
                          <td className="py-6 px-6">
                            <div className={`badge badge-lg rounded-xl font-medium shadow-sm ${
                              log.status === 'completed' 
                                ? 'badge-success' 
                                : 'badge-error'
                            }`}>
                              <Icon 
                                icon={log.status === 'completed' 
                                  ? 'solar:check-circle-bold' 
                                  : 'solar:close-circle-bold'
                                } 
                                className="w-4 h-4 mr-2" 
                              />
                              {log.status === 'completed' ? 'Hoàn thành' : 'Thất bại'}
                            </div>
                            {log.errorMessage && (
                              <div className="text-xs text-error mt-1 truncate max-w-32" title={log.errorMessage}>
                                {log.errorMessage}
                              </div>
                            )}
                          </td>
                          
                          {/* Cột Chi tiết */}
                          <td className="py-6 px-6">
                            <div className="flex items-center gap-2">
                              <Icon icon="solar:eye-bold" className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                              <span className="text-sm font-medium text-primary group-hover:text-primary-focus transition-colors duration-300">
                                Xem chi tiết
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* ... existing pagination code ... */}
            </>
          )}
        </div>
      </div>
      
      {/* Sử dụng component modal */}
      <SyncDetailModal 
        isOpen={isModalOpen}
        selectedLog={selectedLog}
        onClose={closeDetailModal}
      />
    </div>
  );
}
