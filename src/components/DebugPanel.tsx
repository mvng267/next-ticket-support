'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

/**
 * Component debug để kiểm tra dữ liệu trong database
 */
export default function DebugPanel() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Test database connection
   */
  const testDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const result = await response.json();
      setDbStatus(result);
    } catch (error) {
      console.error('Lỗi khi test database:', error);
      setDbStatus({
        success: false,
        error: 'Lỗi kết nối'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Lấy tickets từ database
   */
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/hubspot/sync?limit=5');
      const result = await response.json();
      
      if (result.success) {
        setTickets(result.data.tickets);
      }
    } catch (error) {
      console.error('Lỗi khi lấy tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Icon icon="solar:bug-bold" className="w-6 h-6 text-orange-600" />
        Debug Panel - Kiểm tra hệ thống
      </h2>
      
      <div className="space-y-4">
        {/* Test Database */}
        <div>
          <button
            onClick={testDatabase}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Icon icon="solar:refresh-bold" className="w-4 h-4 animate-spin" />
                Đang test...
              </>
            ) : (
              <>
                <Icon icon="solar:database-bold" className="w-4 h-4" />
                Test Database
              </>
            )}
          </button>
          
          {dbStatus && (
            <div className={`mt-2 p-3 rounded-lg ${
              dbStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`text-sm ${
                dbStatus.success ? 'text-green-800' : 'text-red-800'
              }`}>
                <strong>Database Status:</strong> {dbStatus.success ? 'Connected' : 'Failed'}
                {dbStatus.ticketCount !== undefined && (
                  <div>Tickets trong DB: {dbStatus.ticketCount}</div>
                )}
                {dbStatus.error && <div>Lỗi: {dbStatus.error}</div>}
              </div>
            </div>
          )}
        </div>
        
        {/* Get Tickets */}
        <button
          onClick={fetchTickets}
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Icon icon="solar:refresh-bold" className="w-4 h-4 animate-spin" />
              Đang tải...
            </>
          ) : (
            <>
              <Icon icon="solar:list-bold" className="w-4 h-4" />
              Lấy 5 tickets mới nhất
            </>
          )}
        </button>
      </div>
      
      {tickets.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-medium text-gray-800">Tickets trong database:</h3>
          {tickets.map((ticket, index) => (
            <div key={ticket.id || index} className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>ID:</strong> {ticket.id}</div>
                <div><strong>Subject:</strong> {ticket.subject}</div>
                <div><strong>Company:</strong> {ticket.company_name}</div>
                <div><strong>Owner:</strong> {ticket.owner_name}</div>
                <div><strong>Created:</strong> {new Date(ticket.created_date).toLocaleString()}</div>
                <div><strong>Synced:</strong> {new Date(ticket.synced_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {tickets.length === 0 && !isLoading && (
        <p className="text-gray-500 mt-4">Chưa có dữ liệu. Hãy test database và sync tickets trước.</p>
      )}
    </div>
  );
}