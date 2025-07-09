import PayloadControls from '@/components/PayloadControls';
import DebugPanel from '@/components/DebugPanel';
import { Icon } from '@iconify/react';

/**
 * Trang chính của ứng dụng
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Icon icon="solar:ticket-bold" className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                HubSpot Ticket Sync
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Next.js + SQLite + HubSpot API
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Mô tả */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-blue-600" />
              Về ứng dụng
            </h2>
            <div className="text-gray-600 space-y-2">
              <p>
                Ứng dụng đồng bộ dữ liệu tickets từ HubSpot và lưu trữ cục bộ bằng SQLite.
              </p>
              <p>
                Chọn khoảng thời gian và nhấn nút <strong>Sync Tickets</strong> để bắt đầu đồng bộ.
              </p>
            </div>
          </div>

          {/* Payload Controls */}
          <PayloadControls />

          {/* Debug Panel */}
          <DebugPanel />

          {/* Thông tin kỹ thuật */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Icon icon="solar:code-bold" className="w-5 h-5 text-green-600" />
              Thông tin kỹ thuật
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Frontend:</h3>
                <ul className="space-y-1">
                  <li>• Next.js 14 (App Router)</li>
                  <li>• React 18</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Iconify Icons</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Backend:</h3>
                <ul className="space-y-1">
                  <li>• SQLite (better-sqlite3)</li>
                  <li>• HubSpot API v3</li>
                  <li>• Next.js API Routes</li>
                  <li>• Server-side Processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
