import { NextResponse } from 'next/server';
import DatabaseManager from '@/lib/db';

/**
 * GET handler để test database connection
 */
export async function GET() {
  try {
    const db = DatabaseManager.getInstance();
    const isConnected = db.testConnection();
    const count = db.getTicketCount();
    
    return NextResponse.json({
      success: true,
      connected: isConnected,
      ticketCount: count,
      message: 'Database connection test successful'
    });
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}