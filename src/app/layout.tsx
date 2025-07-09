import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'HubSpot Ticket Sync',
  description: 'Hệ thống đồng bộ tickets từ HubSpot vào Firestore',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-lg font-semibold text-gray-900">
                  Support Tickets
                </Link>
                <Link href="/data" className="text-gray-600 hover:text-gray-900">
                  Dữ liệu
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

