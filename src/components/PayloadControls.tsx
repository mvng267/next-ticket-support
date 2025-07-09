'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { ApiResponse } from '@/types';

interface PayloadControlsProps {
    className?: string;
}

export default function PayloadControls({ className }: PayloadControlsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    /**
     * Gửi request đồng bộ với payload cụ thể
     */
    const handleSync = async (trigger: string) => {
        setIsLoading(true);
        setResponse(null);
        setLogs([`🚀 Bắt đầu ${trigger}...`]);

        try {
            const res = await fetch('/api/hubspot/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ trigger }),
            });

            const data = await res.json();
            setResponse(data);

            if (data.logs) {
                setLogs(prev => [...prev, ...data.logs]);
            }

        } catch (error) {
            const errorMsg = `❌ Lỗi: ${error}`;
            setResponse({
                success: false,
                message: errorMsg,
                error: errorMsg
            });
            setLogs(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon="solar:settings-bold" className="text-blue-600" />
                    Điều khiển đồng bộ HubSpot
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Test */}
                    <button
                        onClick={() => handleSync('test')}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        <Icon icon="solar:bug-bold" />
                        Test
                    </button>

                    {/* Đồng bộ 1 ngày */}
                    <button
                        onClick={() => handleSync('sync_1_day')}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        <Icon icon="solar:calendar-date-bold" />
                        1 ngày trước
                    </button>

                    {/* Đồng bộ 7 ngày */}
                    <button
                        onClick={() => handleSync('sync_7_days')}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 hover:bg-green-200 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        <Icon icon="solar:calendar-bold" />
                        7 ngày gần nhất
                    </button>

                    {/* Đồng bộ 30 ngày */}
                    <button
                        onClick={() => handleSync('sync_30_days')}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        <Icon icon="solar:calendar-mark-bold" />
                        30 ngày gần nhất
                    </button>

                    {/* Đồng bộ tất cả */}
                    <button
                        onClick={() => handleSync('sync_all')}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        <Icon icon="solar:database-bold" />
                        Tất cả tickets
                    </button>
                </div>

                {isLoading && (
                    <div className="mt-4 flex items-center gap-2 text-blue-600">
                        <Icon icon="solar:refresh-bold" className="animate-spin" />
                        Đang xử lý...
                    </div>
                )}
            </div>

            {/* Logs Display */}
            {logs.length > 0 && (
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
                    <h3 className="text-white mb-2 flex items-center gap-2">
                        <Icon icon="solar:document-text-bold" />
                        Logs:
                    </h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto break-words whitespace-pre-wrap">
                        {logs.map((log, index) => (
                            <div key={index} className="text-xs leading-relaxed">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Response Display */}
            {response && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Icon icon="solar:clipboard-text-bold" className="text-purple-600" />
                        Kết quả:
                    </h3>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 break-words whitespace-pre-wrap">
                        {JSON.stringify(response, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}