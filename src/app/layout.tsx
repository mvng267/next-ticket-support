import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HubSpot Ticket Management System',
  description: 'Hệ thống quản lý ticket HubSpot với AI báo cáo thông minh',
};

/**
 * Layout chính của ứng dụng với sidebar navigation theo chuẩn DaisyUI
 * @param children - Nội dung trang con
 * @returns JSX Element với layout sidebar bo tròn đẹp
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-theme="corporate">
      <body className={inter.className}>
        <div className="drawer lg:drawer-open">
          <input id="drawer-toggle" type="checkbox" className="drawer-toggle" />
          
          {/* Nội dung chính */}
          <div className="drawer-content flex flex-col">
            {/* Header với nút menu mobile - Bo tròn đẹp */}
            <div className="navbar bg-gradient-to-r from-base-100 to-base-200 shadow-lg backdrop-blur-sm lg:hidden">
              <div className="flex-none">
                <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost hover:bg-primary/10 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </label>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  HubSpot Tickets
                </h1>
              </div>
              <div className="flex-none">
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                    <div className="w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-primary-content font-bold">U</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Nội dung trang với background gradient */}
            <main className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-base-200 via-base-100 to-base-200 min-h-screen">
              <div className="max-w-12xl mx-auto">
                {children}
              </div>
            </main>
          </div>
          
          {/* Sidebar */}
          <div className="drawer-side">
            <label htmlFor="drawer-toggle" className="drawer-overlay"></label>
            <Sidebar />
          </div>
        </div>
      </body>
    </html>
  );
}