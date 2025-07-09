'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { SyncPayload } from '@/types/ticket';

interface PayloadControlsProps {
  onSync?: (result: any) => void;
}

/**
 * Component điều khiển payload để sync tickets
 */
export default function PayloadControls({ onSync }: PayloadControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<1 | 7 | 30 | 180>(7);
  const [lastResult, setLastResult] = useState<any>(null);

  /**
   * Xử lý sync tickets
   */
  const handleSync = async (days: 1 | 7 | 30 | 180) => {
    setIsLoading(true);
    setLastResult(null);
    
    try {
      const payload: SyncPayload = {
        trigger: 'sync',
        days
      };
      
      const response = await fetch('/api/hubspot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      setLastResult(result);
      
      if (onSync) {
        onSync(result);
      }
      
    } catch (error) {
      console.error('Lỗi khi sync:', error);
      setLastResult({
        success: false,
        error: 'Lỗi kết nối khi sync tickets'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render kết quả sync
   */
  const renderResult = () => {
    if (!lastResult) return null;
    
    if (lastResult.success) {
      return (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
            <span className="font-medium">Đồng bộ thành công!</span>
          </div>
          <p className="text-green-700 mt-1">{lastResult.message}</p>
          {lastResult.synced > 0 && (
            <p className="text-green-600 text-sm mt-1">
              Đã đồng bộ {lastResult.synced} tickets
            </p>
          )}
        </div>
      );
    } else {
      return (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
            <span className="font-medium">Lỗi đồng bộ!</span>
          </div>
          <p className="text-red-700 mt-1">{lastResult.error}</p>
          {lastResult.details && (
            <p className="text-red-600 text-sm mt-1">{lastResult.details}</p>
          )}
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Icon icon="solar:refresh-bold" className="w-6 h-6 text-blue-600" />
        Đồng bộ Tickets từ HubSpot
      </h2>
      
      <div className="space-y-4">
        {/* Chọn khoảng thời gian */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn khoảng thời gian:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: 1, label: '1 ngày trước' },
              { value: 7, label: '7 ngày trước' },
              { value: 30, label: '30 ngày trước' },
              { value: 180, label: '6 tháng trước' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedDays(option.value as 1 | 7 | 30 | 180)}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  selectedDays === option.value
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Nút sync */}
        <button
          onClick={() => handleSync(selectedDays)}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Icon icon="solar:refresh-bold" className="w-5 h-5 animate-spin" />
              Đang đồng bộ...
            </>
          ) : (
            <>
              <Icon icon="solar:download-bold" className="w-5 h-5" />
              Sync Tickets ({selectedDays} ngày)
            </>
          )}
        </button>
      </div>
      
      {/* Hiển thị kết quả */}
      {renderResult()}
    </div>
  );
}