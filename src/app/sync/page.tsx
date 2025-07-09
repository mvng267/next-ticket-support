import PayloadControls from '@/components/PayloadControls';
import DebugPanel from '@/components/DebugPanel';
import { Icon } from '@iconify/react';

/**
 * Trang đồng bộ dữ liệu
 */
export default function SyncPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Icon icon="solar:refresh-bold" className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Đồng bộ dữ liệu
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              HubSpot → SQLite
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
              Về tính năng đồng bộ
            </h2>
            <div className="text-gray-600 space-y-2">
              <p>
                Tính năng này cho phép đồng bộ dữ liệu tickets từ HubSpot và lưu trữ cục bộ bằng SQLite.
              </p>
              <p>
                Chọn khoảng thời gian và nhấn nút <strong>Sync Tickets</strong> để bắt đầu đồng bộ.
              </p>
              <p className="text-amber-600">
                <Icon icon="solar:danger-bold" className="w-4 h-4 inline mr-1" />
                Quá trình đồng bộ có thể mất vài phút tùy thuộc vào số lượng tickets.
              </p>
            </div>
          </div>

          {/* Payload Controls */}
          <PayloadControls />

          {/* Debug Panel */}
          <DebugPanel />
        </div>
      </main>
    </div>
  );
}