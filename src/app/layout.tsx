import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'HubSpot Ticket Sync',
  description: 'Hệ thống đồng bộ tickets từ HubSpot vào SQLite Database',
};

/**
 * Layout chính với sidebar responsive
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="hidden md:flex md:w-64 md:flex-col">
            <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 px-4">
                <Icon icon="solar:ticket-bold" className="w-8 h-8 text-blue-600" />
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  Ticket Sync
                </span>
              </div>
              
              {/* Navigation */}
              <nav className="mt-8 flex-1 px-2 space-y-1">
                <Link
                  href="/"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon icon="solar:home-bold" className="mr-3 w-5 h-5" />
                  Trang chủ
                </Link>
                
                <Link
                  href="/tickets"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon icon="solar:ticket-bold" className="mr-3 w-5 h-5" />
                  Danh sách Tickets
                </Link>
                
                <Link
                  href="/sync"
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon icon="solar:refresh-bold" className="mr-3 w-5 h-5" />
                  Đồng bộ dữ liệu
                </Link>
              </nav>
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          <div className="md:hidden">
            {/* Mobile menu button sẽ được thêm sau */}
          </div>

          {/* Main content */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <main className="flex-1 relative overflow-y-auto focus:outline-none">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

