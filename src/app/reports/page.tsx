'use client';
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

// Interfaces
interface Report {
  id: string;
  content: string;
  startDate: string;
  endDate: string;
  prompt: string;
  type: string;
  ticketIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface ReportsResponse {
  success: boolean;
  data: {
    reports: Report[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

interface ReportPayload {
  type: string;
  startDate?: string;
  endDate?: string;
  prompt: string;
}

interface PromptTemplate {
  id: string;
  prompt: string;
}

interface PromptsResponse {
  success: boolean;
  data: PromptTemplate[];
  message?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [editingPrompts, setEditingPrompts] = useState<PromptTemplate[]>([]);
  const [savingPrompts, setSavingPrompts] = useState(false);

  // Lấy danh sách báo cáo
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw new Error('Không thể tải danh sách báo cáo');
      }
      const data: ReportsResponse = await response.json();
      if (data.success) {
        setReports(data.data.reports);
      } else {
        throw new Error(data.message || 'Lỗi không xác định');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách prompt templates
  const fetchPromptTemplates = async () => {
    try {
      const response = await fetch('/api/prompts');
      if (!response.ok) {
        throw new Error('Không thể tải prompt templates');
      }
      const data: PromptsResponse = await response.json();
      if (data.success) {
        setPromptTemplates(data.data);
        setEditingPrompts(data.data);
      }
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
      setError('Có lỗi xảy ra khi tải prompt templates');
    }
  };

  // Lưu prompt templates
  const savePromptTemplates = async () => {
    setSavingPrompts(true);
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompts: editingPrompts })
      });

      if (!response.ok) {
        throw new Error('Không thể lưu prompt templates');
      }

      const result = await response.json();
      if (result.success) {
        setPromptTemplates(editingPrompts);
        setShowPromptModal(false);
        setError(null);
      } else {
        throw new Error(result.message || 'Lỗi lưu prompt templates');
      }
    } catch (error) {
      console.error('Error saving prompt templates:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu prompt templates');
    } finally {
      setSavingPrompts(false);
    }
  };

  // Lấy prompt từ database thay vì hardcode
  const getPromptByType = (type: string) => {
    const template = promptTemplates.find(p => p.id === type);
    return template?.prompt || 'Tạo báo cáo phân tích chi tiết về tickets trong khoảng thời gian được chọn.';
  };

  // Tạo báo cáo mới
  const createReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      // Tính toán ngày tháng cho các loại báo cáo
      const getDateRange = (type: string) => {
        const now = new Date();
        let startDate: Date, endDate: Date;
        
        switch (type) {
          case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
          case 'weekly':
            const dayOfWeek = now.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + 6, 23, 59, 59);
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;
          default:
            if (!dateRange.startDate || !dateRange.endDate) {
              throw new Error('Vui lòng chọn khoảng thời gian cho báo cáo tùy chỉnh');
            }
            startDate = new Date(dateRange.startDate);
            endDate = new Date(dateRange.endDate + 'T23:59:59');
        }
        
        return {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
      };
      
      const dates = getDateRange(reportType);
      const payload: ReportPayload = {
        type: reportType,
        startDate: dates.startDate,
        endDate: dates.endDate,
        prompt: getPromptByType(reportType)
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể tạo báo cáo');
      }
      
      const result = await response.json();
      if (result.success) {
        await fetchReports();
        setShowCreateModal(false);
        setDateRange({ startDate: '', endDate: '' });
      } else {
        throw new Error(result.message || 'Không thể tạo báo cáo');
      }
    } catch (error) {
      console.error('Lỗi khi tạo báo cáo:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo báo cáo');
    } finally {
      setGenerating(false);
    }
  };

  // Format ngày tháng
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lấy icon theo loại báo cáo
  const getReportIcon = (type: string) => {
    switch (type) {
      case 'daily': return 'solar:calendar-date-bold-duotone';
      case 'weekly': return 'solar:calendar-bold-duotone';
      case 'monthly': return 'solar:calendar-month-bold-duotone';
      default: return 'solar:document-text-bold-duotone';
    }
  };

  // Xóa báo cáo
  const deleteReport = async (reportId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
      } else {
        throw new Error('Không thể xóa báo cáo');
      }
    } catch (error) {
      console.error('Lỗi khi xóa báo cáo:', error);
      setError('Có lỗi xảy ra khi xóa báo cáo');
    }
  };

  useEffect(() => {
    fetchReports();
    fetchPromptTemplates();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header với gradient đẹp */}
      <div className="hero bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl p-8">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Icon icon="solar:chart-2-bold-duotone" className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Báo cáo AI
            </h1>
            <p className="text-base-content/70 text-lg">
              Tạo và quản lý báo cáo phân tích từ ticket với AI thông minh
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
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
                onClick={() => setError(null)}
              >
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button 
          className="btn btn-primary btn-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 gap-3"
          onClick={() => setShowCreateModal(true)}
          disabled={generating}
        >
          <Icon icon="solar:add-circle-bold-duotone" className="w-6 h-6" />
          Tạo báo cáo mới
        </button>
        <button 
          className="btn btn-secondary btn-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 gap-3"
          onClick={() => setShowPromptModal(true)}
        >
          <Icon icon="solar:settings-bold-duotone" className="w-6 h-6" />
          Quản lý Prompt Templates
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 shadow-2xl rounded-3xl border border-primary/20">
          <div className="card-body p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-4">
              <Icon icon="solar:document-text-bold-duotone" className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">{reports.length}</div>
            <div className="text-base-content/70 font-medium">Tổng báo cáo</div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-success/10 to-success/5 shadow-2xl rounded-3xl border border-success/20">
          <div className="card-body p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-success to-success/80 rounded-2xl flex items-center justify-center mb-4">
              <Icon icon="solar:calendar-date-bold-duotone" className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-success mb-2">
              {reports.filter(r => r.type === 'daily').length}
            </div>
            <div className="text-base-content/70 font-medium">Báo cáo ngày</div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-info/10 to-info/5 shadow-2xl rounded-3xl border border-info/20">
          <div className="card-body p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-info to-info/80 rounded-2xl flex items-center justify-center mb-4">
              <Icon icon="solar:calendar-bold-duotone" className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-info mb-2">
              {reports.filter(r => r.type === 'weekly').length}
            </div>
            <div className="text-base-content/70 font-medium">Báo cáo tuần</div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-warning/10 to-warning/5 shadow-2xl rounded-3xl border border-warning/20">
          <div className="card-body p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-warning to-warning/80 rounded-2xl flex items-center justify-center mb-4">
              <Icon icon="solar:calendar-month-bold-duotone" className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-warning mb-2">
              {reports.filter(r => r.type === 'monthly').length}
            </div>
            <div className="text-base-content/70 font-medium">Báo cáo tháng</div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="card bg-base-100 shadow-2xl rounded-3xl border border-base-200/50">
        <div className="card-body p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Icon icon="solar:list-bold-duotone" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="card-title text-2xl font-bold text-base-content">Danh sách báo cáo</h2>
              <p className="text-base-content/60">Xem và quản lý tất cả báo cáo đã tạo</p>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-16">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 text-base-content/60 text-lg">Đang tải báo cáo...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-base-200 rounded-3xl flex items-center justify-center mb-6">
                <Icon icon="solar:document-text-bold-duotone" className="w-12 h-12 text-base-content/30" />
              </div>
              <p className="text-base-content/60 text-lg mb-6">Chưa có báo cáo nào</p>
              <button 
                className="btn btn-primary rounded-2xl shadow-lg"
                onClick={() => setShowCreateModal(true)}
              >
                <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                Tạo báo cáo đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr className="border-base-200">
                    <th className="text-base-content/80 font-semibold">Loại</th>
                    <th className="text-base-content/80 font-semibold">Khoảng thời gian</th>
                    <th className="text-base-content/80 font-semibold">Số ticket</th>
                    <th className="text-base-content/80 font-semibold">Ngày tạo</th>
                    <th className="text-base-content/80 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-base-200/50 transition-colors duration-200">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Icon 
                              icon={getReportIcon(report.type)} 
                              className="w-5 h-5 text-primary" 
                            />
                          </div>
                          <div className="badge badge-outline badge-lg rounded-xl">
                            {report.type === 'daily' ? 'Hàng ngày' :
                             report.type === 'weekly' ? 'Hàng tuần' :
                             report.type === 'monthly' ? 'Hàng tháng' : 'Tùy chỉnh'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium">{formatDate(report.startDate)}</div>
                          <div className="text-base-content/60">đến {formatDate(report.endDate)}</div>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-ghost badge-lg rounded-xl">
                          {report.ticketIds?.length || 0} ticket
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-base-content/60">
                          {formatDate(report.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-ghost btn-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Icon icon="solar:eye-bold" className="w-4 h-4" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm rounded-xl hover:bg-error/10 hover:text-error transition-all duration-300"
                            onClick={() => deleteReport(report.id)}
                          >
                            <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal tạo báo cáo */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Icon icon="solar:add-circle-bold-duotone" className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-2xl">Tạo báo cáo mới</h3>
            </div>
            
            <div className="space-y-6">
              {/* Loại báo cáo */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/80">
                    <Icon icon="solar:document-text-bold-duotone" className="w-4 h-4 inline mr-2" />
                    Loại báo cáo
                  </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'daily', label: 'Hàng ngày', icon: 'solar:calendar-date-bold-duotone' },
                    { value: 'weekly', label: 'Hàng tuần', icon: 'solar:calendar-bold-duotone' },
                    { value: 'monthly', label: 'Hàng tháng', icon: 'solar:calendar-month-bold-duotone' },
                    { value: 'custom', label: 'Tùy chỉnh', icon: 'solar:settings-bold-duotone' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      className={`btn btn-outline rounded-2xl transition-all duration-300 ${
                        reportType === type.value 
                          ? 'btn-primary shadow-lg' 
                          : 'hover:border-primary hover:bg-primary/5'
                      }`}
                      onClick={() => setReportType(type.value as any)}
                    >
                      <Icon icon={type.icon} className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khoảng thời gian tùy chỉnh */}
              {reportType === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
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
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
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
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action mt-8">
              <button 
                className="btn btn-ghost rounded-xl" 
                onClick={() => setShowCreateModal(false)}
                disabled={generating}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary rounded-xl shadow-lg" 
                onClick={createReport}
                disabled={generating || (reportType === 'custom' && (!dateRange.startDate || !dateRange.endDate))}
              >
                {generating && <span className="loading loading-spinner loading-sm"></span>}
                {generating ? 'Đang tạo...' : 'Tạo báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal quản lý Prompt Templates */}
      {showPromptModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[80vh] rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center">
                <Icon icon="solar:settings-bold-duotone" className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-2xl">Quản lý Prompt Templates</h3>
                <p className="text-base-content/60">Chỉnh sửa các mẫu prompt cho từng loại báo cáo</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {[
                { id: 'daily', label: 'Báo cáo hàng ngày', icon: 'solar:calendar-date-bold-duotone', color: 'success' },
                { id: 'weekly', label: 'Báo cáo hàng tuần', icon: 'solar:calendar-bold-duotone', color: 'info' },
                { id: 'monthly', label: 'Báo cáo hàng tháng', icon: 'solar:calendar-month-bold-duotone', color: 'warning' },
                { id: 'custom', label: 'Báo cáo tùy chỉnh', icon: 'solar:settings-bold-duotone', color: 'secondary' }
              ].map((type) => {
                const currentPrompt = editingPrompts.find(p => p.id === type.id);
                return (
                  <div key={type.id} className={`card bg-${type.color}/5 border border-${type.color}/20 rounded-2xl`}>
                    <div className="card-body p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 bg-${type.color}/20 rounded-xl flex items-center justify-center`}>
                          <Icon icon={type.icon} className={`w-5 h-5 text-${type.color}`} />
                        </div>
                        <h4 className="font-bold text-lg">{type.label}</h4>
                      </div>
                      <div className="form-control">
                        <textarea 
                          className="textarea textarea-bordered rounded-xl h-32 focus:border-primary transition-all duration-300"
                          placeholder={`Nhập prompt cho ${type.label.toLowerCase()}...`}
                          value={currentPrompt?.prompt || ''}
                          onChange={(e) => {
                            setEditingPrompts(prev => {
                              const updated = [...prev];
                              const index = updated.findIndex(p => p.id === type.id);
                              if (index >= 0) {
                                updated[index] = { ...updated[index], prompt: e.target.value };
                              } else {
                                updated.push({ id: type.id, prompt: e.target.value });
                              }
                              return updated;
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-action mt-8">
              <button 
                className="btn btn-ghost rounded-xl" 
                onClick={() => {
                  setShowPromptModal(false);
                  setEditingPrompts(promptTemplates);
                }}
                disabled={savingPrompts}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary rounded-xl shadow-lg" 
                onClick={savePromptTemplates}
                disabled={savingPrompts}
              >
                {savingPrompts && <span className="loading loading-spinner loading-sm"></span>}
                {savingPrompts ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết báo cáo */}
      {selectedReport && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[80vh] rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <Icon icon={getReportIcon(selectedReport.type)} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl">
                    Báo cáo {selectedReport.type === 'daily' ? 'hàng ngày' :
                             selectedReport.type === 'weekly' ? 'hàng tuần' :
                             selectedReport.type === 'monthly' ? 'hàng tháng' : 'tùy chỉnh'}
                  </h3>
                  <p className="text-base-content/60">
                    {formatDate(selectedReport.startDate)} - {formatDate(selectedReport.endDate)}
                  </p>
                </div>
              </div>
              <button 
                className="btn btn-ghost btn-sm btn-circle rounded-xl"
                onClick={() => setSelectedReport(null)}
              >
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-4 text-sm text-base-content/60 bg-base-200/50 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:tag-bold" className="w-4 h-4" />
                  <span>Loại: {selectedReport.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:ticket-bold" className="w-4 h-4" />
                  <span>{selectedReport.ticketIds?.length || 0} ticket</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:calendar-bold" className="w-4 h-4" />
                  <span>Tạo: {formatDate(selectedReport.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="bg-base-100 border border-base-200 rounded-2xl p-6 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{selectedReport.content}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}