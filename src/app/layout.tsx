import type { Metadata } from 'next';
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
        {children}
      </body>
    </html>
  );
}
