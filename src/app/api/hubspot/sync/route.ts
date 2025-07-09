// API route xử lý đồng bộ tickets từ HubSpot với progress realtime
import { NextRequest, NextResponse } from 'next/server';
import { fetchTicketsFromHubSpot, ProgressCallback } from '@/lib/hubspot';
import { processTicketDataWithDetails, saveTicketToFirestore, saveTestTicket } from '@/lib/firestore';
import { SyncPayload, ApiResponse, ProcessedTicket } from '@/types';

/**
 * POST /api/hubspot/sync
 * Xử lý đồng bộ tickets từ HubSpot vào Firestore với progress realtime
 */
export async function POST(request: NextRequest) {
  try {
    const payload: SyncPayload = await request.json();
    console.log('📨 Received payload:', JSON.stringify(payload, null, 2));
    
    // Chế độ test - kiểm tra kết nối và lưu ticket mẫu
    if (payload.trigger === 'test') {
      console.log('🧪 Running test mode...');
      
      try {
        await saveTestTicket();
        
        return NextResponse.json({
          success: true,
          message: 'Test ticket saved successfully',
          logs: ['Test mode executed', 'Sample ticket created and saved'],
          timestamp: new Date().toISOString()
        } as ApiResponse);
        
      } catch (error) {
        console.error('Test failed:', error);
        
        return NextResponse.json({
          success: false,
          message: 'Test failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          logs: ['Test mode failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          timestamp: new Date().toISOString()
        } as ApiResponse, { status: 500 });
      }
    }
    
    // Validate payload cho các trigger sync - ĐÃ THÊM sync_1_day
    const validTriggers = ['sync_all', 'sync_30_days', 'sync_7_days', 'sync_1_day'];
    if (!validTriggers.includes(payload.trigger)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid payload trigger',
        error: `Trigger phải là một trong: ${validTriggers.join(', ')}, test`,
        logs: [`Invalid trigger: ${payload.trigger}`]
      } as ApiResponse, { status: 400 });
    }

    const logs: string[] = [];
    let daysBack: number | undefined;
    let syncDescription = '';
    
    // Xác định phương án đồng bộ dựa trên trigger - ĐÃ THÊM sync_1_day
    switch (payload.trigger) {
      case 'sync_all':
        daysBack = undefined;
        syncDescription = 'tất cả tickets';
        logs.push('🔄 Bắt đầu đồng bộ tất cả tickets từ HubSpot...');
        break;
      case 'sync_30_days':
        daysBack = 30;
        syncDescription = 'tickets 30 ngày gần nhất';
        logs.push('🔄 Bắt đầu đồng bộ tickets 30 ngày gần nhất từ HubSpot...');
        break;
      case 'sync_7_days':
        daysBack = 7;
        syncDescription = 'tickets 7 ngày gần nhất';
        logs.push('🔄 Bắt đầu đồng bộ tickets 7 ngày gần nhất từ HubSpot...');
        break;
      case 'sync_1_day':
        daysBack = 1;
        syncDescription = 'tickets 1 ngày gần nhất';
        logs.push('🔄 Bắt đầu đồng bộ tickets 1 ngày gần nhất từ HubSpot...');
        break;
    }
    
    // Biến để track progress
    let currentProgress = 0;
    let totalTickets = 0;
    let fetchedTickets = 0;
    let processedTickets = 0;
    let savedTickets = 0;
    
    // Progress callback cho việc fetch
    const fetchProgressCallback: ProgressCallback = (current, total, message) => {
      fetchedTickets = current;
      totalTickets = total;
      currentProgress = Math.round((current / total) * 30); // 30% cho fetch
      logs.push(`📊 Fetch Progress: ${currentProgress}% - ${message}`);
      console.log(`📊 Fetch: ${currentProgress}% (${current}/${total}) - ${message}`);
    };
    
    // Lấy tickets từ HubSpot API với progress tracking
    logs.push('📡 Đang kết nối với HubSpot API...');
    const hubspotTickets = await fetchTicketsFromHubSpot(daysBack, fetchProgressCallback);
    
    if (hubspotTickets.length === 0) {
      logs.push('ℹ️ Không có tickets nào để đồng bộ');
      return NextResponse.json({
        success: true,
        message: 'Không có tickets nào để đồng bộ',
        data: { 
          count: 0,
          progress: 100,
          stages: {
            fetch: 100,
            process: 100,
            save: 100
          }
        },
        logs
      } as ApiResponse);
    }

    totalTickets = hubspotTickets.length;
    logs.push(`📥 Đã lấy ${totalTickets} tickets từ HubSpot`);
    
    // Xử lý và chuyển đổi dữ liệu tickets với progress tracking
    logs.push('⚙️ Đang xử lý dữ liệu tickets...');
    const processedTicketsList: ProcessedTicket[] = [];
    
    // Xử lý theo batch để hiển thị progress
    const batchSize = 20;
    for (let i = 0; i < totalTickets; i += batchSize) {
      const batch = hubspotTickets.slice(i, Math.min(i + batchSize, totalTickets));
      
      // Xử lý batch song song
      const batchPromises = batch.map(async (ticket, index) => {
        try {
          // SỬA: Thay processTicketData bằng processTicketDataWithDetails
          const processed = await processTicketDataWithDetails(ticket);
          processedTickets++;
          
          // Cập nhật progress (30% fetch + 40% process)
          const processProgress = Math.round((processedTickets / totalTickets) * 40);
          currentProgress = 30 + processProgress;
          
          if ((processedTickets % 10) === 0 || processedTickets === totalTickets) {
            logs.push(`🔄 Process Progress: ${currentProgress}% - Đã xử lý ${processedTickets}/${totalTickets} tickets`);
            console.log(`🔄 Process: ${currentProgress}% (${processedTickets}/${totalTickets})`);
          }
          
          return processed;
        } catch (error) {
          const errorMsg = `❌ Lỗi xử lý ticket ${ticket.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          logs.push(errorMsg);
          console.error(`Error processing ticket ${ticket.id}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(result => result !== null) as ProcessedTicket[];
      processedTicketsList.push(...validResults);
      
      // Thêm delay nhỏ giữa các batch
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (processedTicketsList.length === 0) {
      logs.push('❌ Không có tickets nào được xử lý thành công');
      return NextResponse.json({
        success: false,
        message: 'Không có tickets nào được xử lý thành công',
        error: 'All tickets failed to process',
        logs
      } as ApiResponse, { status: 500 });
    }

    // Lưu tickets vào Firestore với progress tracking
    logs.push('💾 Đang lưu tickets vào Firestore...');
    
    // Lưu theo batch với progress
    const saveBatchSize = 10;
    for (let i = 0; i < processedTicketsList.length; i += saveBatchSize) {
      const batch = processedTicketsList.slice(i, Math.min(i + saveBatchSize, processedTicketsList.length));
      
      try {
        // Lưu từng ticket trong batch
        for (const ticket of batch) {
          await saveTicketToFirestore(ticket);
          savedTickets++;
          
          // Cập nhật progress (30% fetch + 40% process + 30% save)
          const saveProgress = Math.round((savedTickets / processedTicketsList.length) * 30);
          currentProgress = 70 + saveProgress;
          
          if ((savedTickets % 5) === 0 || savedTickets === processedTicketsList.length) {
            logs.push(`💾 Save Progress: ${currentProgress}% - Đã lưu ${savedTickets}/${processedTicketsList.length} tickets`);
            console.log(`💾 Save: ${currentProgress}% (${savedTickets}/${processedTicketsList.length})`);
          }
        }
      } catch (error) {
        console.error('Error saving batch:', error);
        logs.push(`❌ Lỗi lưu batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Delay giữa các batch save
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    currentProgress = 100;
    logs.push(`🎉 Hoàn thành! Đã đồng bộ thành công ${savedTickets}/${processedTicketsList.length} tickets`);
    
    return NextResponse.json({
      success: true,
      message: `Đã đồng bộ thành công ${savedTickets} ${syncDescription}`,
      data: {
        count: savedTickets,
        syncType: payload.trigger,
        daysBack,
        progress: 100,
        stages: {
          fetch: 100,
          process: 100,
          save: 100
        },
        stats: {
          totalFetched: totalTickets,
          processed: processedTicketsList.length,
          saved: savedTickets,
          failed: totalTickets - processedTicketsList.length
        },
        tickets: processedTicketsList.slice(0, 10).map(t => ({
          id: t.id,
          ticketId: t.ticketId,
          subject: t.subject,
          category: t.category,
          createDate: t.createDate // ĐÃ CẬP NHẬT: createDate dưới dạng string từ HubSpot
        }))
      },
      logs
    } as ApiResponse);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorLogs = [
      '❌ Lỗi trong quá trình đồng bộ',
      `Error: ${errorMessage}`
    ];
    
    console.error('Lỗi trong quá trình đồng bộ:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Lỗi trong quá trình đồng bộ',
      error: errorMessage,
      logs: errorLogs,
      timestamp: new Date().toISOString()
    } as ApiResponse, { status: 500 });
  }
}