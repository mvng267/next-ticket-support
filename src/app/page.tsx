'use client';
import { useState } from 'react';
import { Icon } from '@iconify/react';

// Thêm interfaces
interface TestResult {
  success: boolean;
  error?: string;
  message?: string;
}

interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  bgColor: string;
}

/**
 * Trang Dashboard chính với giao diện DaisyUI bo tròn đẹp
 * @returns JSX Element dashboard với stats và test functions
 */
export default function HomePage() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  /**
   * Test database connection
   */
  const testDatabase = async () => {
    setLoading(prev => ({ ...prev, db: true }));
    try {
      const response = await fetch('/api/test/database');
      const result: TestResult = await response.json();
      setTestResults(prev => ({ ...prev, db: result }));
    } catch (error) {
      console.error('Database test error:', error);
      setTestResults(prev => ({ ...prev, db: { success: false, error: 'Database failed' } }));
    }
    setLoading(prev => ({ ...prev, db: false }));
  };
  
  /**
   * Test HubSpot API
   */
  const testHubSpot = async () => {
    setLoading(prev => ({ ...prev, hubspot: true }));
    try {
      const response = await fetch('/api/test/hubspot');
      const result: TestResult = await response.json();
      setTestResults(prev => ({ ...prev, hubspot: result }));
    } catch (error) {
      console.error('HubSpot test error:', error);
      setTestResults(prev => ({ ...prev, hubspot: { success: false, error: 'API failed' } }));
    }
    setLoading(prev => ({ ...prev, hubspot: false }));
  };
  
  /**
   * Test Gemini AI
   */
  const testGemini = async () => {
    setLoading(prev => ({ ...prev, gemini: true }));
    try {
      const response = await fetch('/api/test/gemini');
      const result: TestResult = await response.json();
      setTestResults(prev => ({ ...prev, gemini: result }));
    } catch (error) {
      console.error('Gemini test error:', error);
      setTestResults(prev => ({ ...prev, gemini: { success: false, error: 'AI failed' } }));
    }
    setLoading(prev => ({ ...prev, gemini: false }));
  };
  
  const stats: StatItem[] = [
    {
      title: 'Tổng Tickets',
      value: '1,234',
      change: '+12%',
      icon: 'solar:ticket-bold-duotone',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Đã xử lý',
      value: '856',
      change: '+8%',
      icon: 'solar:check-circle-bold-duotone',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Đang xử lý',
      value: '234',
      change: '-3%',
      icon: 'solar:clock-circle-bold-duotone',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Báo cáo AI',
      value: '45',
      change: '+25%',
      icon: 'solar:chart-2-bold-duotone',
      color: 'text-info',
      bgColor: 'bg-info/10'
    }
  ];
  
  return (
    <div className="space-y-8">
      {/* Header với gradient đẹp */}
      <div className="hero bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl p-8">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Icon icon="solar:home-2-bold-duotone" className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Dashboard
            </h1>
            <p className="text-base-content/70 text-lg">
              Tổng quan hệ thống quản lý tickets HubSpot với AI thông minh
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards với hiệu ứng đẹp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="stats shadow-xl bg-base-100 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="stat p-6">
              <div className="stat-figure">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon icon={stat.icon} className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="stat-title text-base-content/60 font-medium">{stat.title}</div>
              <div className={`stat-value text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className={`stat-desc font-medium ${
                stat.change.startsWith('+') ? 'text-success' : 'text-error'
              }`}>
                {stat.change} từ tháng trước
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Test Functions với design mới */}
      <div className="card bg-base-100 shadow-2xl rounded-3xl border border-base-200/50">
        <div className="card-body p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Icon icon="solar:settings-bold-duotone" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="card-title text-2xl font-bold text-base-content">Test Functions</h2>
              <p className="text-base-content/60">Kiểm tra kết nối các dịch vụ</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Test Database */}
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Icon icon="solar:database-bold-duotone" className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">Database</h3>
                </div>
                <button 
                  className="btn btn-primary rounded-xl w-full mb-4 shadow-lg hover:shadow-xl transition-all"
                  onClick={testDatabase}
                  disabled={loading.db}
                >
                  {loading.db && <span className="loading loading-spinner loading-sm"></span>}
                  Test Database
                </button>
                {testResults.db && (
                  <div className={`alert rounded-xl ${
                    testResults.db.success ? 'alert-success' : 'alert-error'
                  }`}>
                    <Icon 
                      icon={testResults.db.success ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} 
                      className="w-5 h-5" 
                    />
                    <span className="text-sm font-medium">
                      {testResults.db.success ? 'Kết nối thành công' : testResults.db.error}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Test HubSpot */}
            <div className="card bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
                    <Icon icon="solar:server-bold-duotone" className="w-5 h-5 text-warning" />
                  </div>
                  <h3 className="font-bold text-lg">HubSpot API</h3>
                </div>
                <button 
                  className="btn btn-warning rounded-xl w-full mb-4 shadow-lg hover:shadow-xl transition-all"
                  onClick={testHubSpot}
                  disabled={loading.hubspot}
                >
                  {loading.hubspot && <span className="loading loading-spinner loading-sm"></span>}
                  Test HubSpot
                </button>
                {testResults.hubspot && (
                  <div className={`alert rounded-xl ${
                    testResults.hubspot.success ? 'alert-success' : 'alert-error'
                  }`}>
                    <Icon 
                      icon={testResults.hubspot.success ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} 
                      className="w-5 h-5" 
                    />
                    <span className="text-sm font-medium">
                      {testResults.hubspot.success ? 'API hoạt động' : testResults.hubspot.error}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Test Gemini */}
            <div className="card bg-gradient-to-br from-info/5 to-info/10 border border-info/20 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-info/20 rounded-xl flex items-center justify-center">
                    <Icon icon="solar:magic-stick-3-bold-duotone" className="w-5 h-5 text-info" />
                  </div>
                  <h3 className="font-bold text-lg">Gemini AI</h3>
                </div>
                <button 
                  className="btn btn-info rounded-xl w-full mb-4 shadow-lg hover:shadow-xl transition-all"
                  onClick={testGemini}
                  disabled={loading.gemini}
                >
                  {loading.gemini && <span className="loading loading-spinner loading-sm"></span>}
                  Test Gemini
                </button>
                {testResults.gemini && (
                  <div className={`alert rounded-xl ${
                    testResults.gemini.success ? 'alert-success' : 'alert-error'
                  }`}>
                    <Icon 
                      icon={testResults.gemini.success ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} 
                      className="w-5 h-5" 
                    />
                    <span className="text-sm font-medium">
                      {testResults.gemini.success ? 'AI sẵn sàng' : testResults.gemini.error}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-primary to-primary/80 text-primary-content shadow-2xl rounded-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
          <div className="card-body p-6">
            <Icon icon="solar:refresh-bold-duotone" className="w-8 h-8 mb-4" />
            <h3 className="card-title text-lg">Đồng bộ Tickets</h3>
            <p className="text-primary-content/80">Đồng bộ dữ liệu mới nhất từ HubSpot</p>
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-primary-content rounded-xl">
                Đồng bộ ngay
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-secondary to-secondary/80 text-secondary-content shadow-2xl rounded-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
          <div className="card-body p-6">
            <Icon icon="solar:chart-2-bold-duotone" className="w-8 h-8 mb-4" />
            <h3 className="card-title text-lg">Tạo Báo cáo</h3>
            <p className="text-secondary-content/80">Tạo báo cáo AI thông minh</p>
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-secondary-content rounded-xl">
                Tạo báo cáo
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-accent to-accent/80 text-accent-content shadow-2xl rounded-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
          <div className="card-body p-6">
            <Icon icon="solar:ticket-bold-duotone" className="w-8 h-8 mb-4" />
            <h3 className="card-title text-lg">Quản lý Tickets</h3>
            <p className="text-accent-content/80">Xem và quản lý tất cả tickets</p>
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-accent-content rounded-xl">
                Xem tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}