// Trang chính hiển thị giao diện đồng bộ tickets
import PayloadControls from '@/components/PayloadControls';
import { Icon } from '@iconify/react';

/**
 * Trang chính của ứng dụng
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icon icon="solar:ticket-bold-duotone" className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">
              HubSpot Ticket Sync
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hệ thống đồng bộ tickets từ HubSpot vào Firestore. 
          </p>
        </div>
        {/* Sync Controls */}
        <div className="flex justify-center mb-12">
          <PayloadControls />
        </div>
      </div>
    </main>
  );
}
