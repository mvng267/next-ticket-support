import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo Prisma client và Gemini AI
const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Định nghĩa interfaces
interface PromptRecord {
  prompt: string;
}

interface WebhookPayload {
  type: string;
  from: string;
  to: string;
  report: string;
  ticketCount: number;
}

interface TicketSummary {
  id: number;
  subject: string;
  content: string;
  category: string | null;
  owner: string | null;
  company: string | null;
  createDate: Date;
  pipelineStage: string | null;
}

/**
 * Tính toán khoảng thời gian dựa trên loại báo cáo
 * @param type - Loại báo cáo (day, week, month)
 * @returns Object chứa startDate và endDate
 */
function calculateDateRange(type: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;

  switch (type) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate };
}

/**
 * Lấy prompt từ database hoặc sử dụng prompt mặc định
 * @param type - Loại báo cáo
 * @returns Promise<PromptRecord>
 */
async function getPromptRecord(type: string): Promise<PromptRecord> {
  try {
    const promptRecord = await prisma.prompt.findUnique({
      where: { id: type }
    });

    if (promptRecord) {
      return { prompt: promptRecord.prompt };
    }
  } catch (promptError) {
    console.error('Lỗi truy vấn prompt:', promptError);
  }

  // Sử dụng prompt mặc định
  return {
    prompt: `Hãy phân tích các ticket support và tạo báo cáo tổng hợp cho khoảng thời gian ${type}. Bao gồm:
1. Tổng quan số lượng ticket
2. Phân loại theo danh mục
3. Xu hướng và vấn đề nổi bật
4. Đề xuất cải thiện`
  };
}

/**
 * Chuẩn bị dữ liệu ticket cho AI
 * @param tickets - Danh sách tickets
 * @returns Mảng TicketSummary
 */
function prepareTicketSummary(tickets: any[]): TicketSummary[] {
  return tickets.map(ticket => ({
    id: ticket.id,
    subject: ticket.subject,
    content: ticket.content ? ticket.content.substring(0, 200) + '...' : 'Không có nội dung',
    category: ticket.category,
    owner: ticket.owner,
    company: ticket.company,
    createDate: ticket.createDate,
    pipelineStage: ticket.pipelineStage
  }));
}

/**
 * Gửi webhook notification
 * @param payload - Dữ liệu webhook
 */
async function sendWebhook(payload: WebhookPayload): Promise<void> {
  if (!process.env.WEBHOOK_URL) return;

  try {
    const response = await fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }
  } catch (webhookError) {
    console.error('Lỗi gửi webhook:', webhookError);
  }
}

/**
 * Ghi log cron job
 * @param task - Tên task
 * @param status - Trạng thái
 * @param message - Thông điệp
 */
async function logCronJob(task: string, status: string, message: string): Promise<void> {
  try {
    await prisma.cronLog.create({
      data: { task, status, message }
    });
  } catch (logError) {
    console.error('Lỗi ghi log:', logError);
  }
}

/**
 * Tạo báo cáo tự động theo lịch
 * @param request - Request object chứa type báo cáo
 * @returns Response với kết quả tạo báo cáo
 */
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') || 'day';
  
  try {
    // Validate type parameter
    if (!['day', 'week', 'month'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Loại báo cáo không hợp lệ' },
        { status: 400 }
      );
    }

    // Log bắt đầu cron job
    await logCronJob(`report_${type}`, 'started', `Bắt đầu tạo báo cáo ${type}`);
    
    // Tính toán khoảng thời gian
    const { startDate, endDate } = calculateDateRange(type);
    
    // Lấy prompt
    const promptRecord = await getPromptRecord(type);
    
    // Lấy tickets trong khoảng thời gian
    const tickets = await prisma.ticket.findMany({
      where: {
        createDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createDate: 'desc' }
    });
    
    // Kiểm tra nếu không có tickets
    if (tickets.length === 0) {
      await logCronJob(
        `report_${type}`, 
        'completed', 
        `Không có tickets trong khoảng thời gian ${type}`
      );
      
      return NextResponse.json({
        success: true,
        message: 'Không có tickets để tạo báo cáo',
        data: {
          ticketCount: 0,
          dateRange: {
            from: startDate.toISOString(),
            to: endDate.toISOString()
          }
        }
      });
    }
    
    // Chuẩn bị dữ liệu cho AI
    const ticketSummary = prepareTicketSummary(tickets);
    
    // Tạo prompt cho AI
    const aiPrompt = `
${promptRecord.prompt}

Dữ liệu tickets (${tickets.length} tickets từ ${startDate.toISOString()} đến ${endDate.toISOString()}):
${JSON.stringify(ticketSummary, null, 2)}

Hãy phân tích và tạo báo cáo chi tiết bằng tiếng Việt.
    `;
    
    // Gọi Gemini AI với timeout
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Tạo timeout cho AI request
    const aiPromise = model.generateContent(aiPrompt);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout')), 60000)
    );
    
    const result = await Promise.race([aiPromise, timeoutPromise]) as any;
    const reportContent = result.response.text();
    
    // Lưu báo cáo vào database
    const report = await prisma.report.create({
      data: {
        ticketIds: tickets.map((t: Ticket) => t.id),
        content: reportContent,
        startDate,
        endDate,
        prompt: promptRecord.prompt,
        type
      }
    });
    
    // Gửi webhook notification
    await sendWebhook({
      type,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      report: reportContent,
      ticketCount: tickets.length
    });
    
    // Log thành công
    await logCronJob(
      `report_${type}`, 
      'success', 
      `Đã tạo báo cáo ${type} với ${tickets.length} tickets`
    );
    
    return NextResponse.json({
      success: true,
      message: `Báo cáo ${type} đã được tạo thành công`,
      data: {
        reportId: report.id,
        ticketCount: tickets.length,
        dateRange: {
          from: startDate.toISOString(),
          to: endDate.toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Lỗi cron báo cáo:', error);
    
    // Log lỗi
    await logCronJob(
      `report_${type}`,
      'failed',
      error instanceof Error ? error.message : 'Lỗi không xác định'
    );
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Lỗi tạo báo cáo tự động',
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      },
      { status: 500 }
    );
  } finally {
    // Đảm bảo đóng kết nối Prisma
    await prisma.$disconnect();
  }
}

// Thêm interface này ở đầu file
interface Ticket {
  id: number;
  subject: string;
  content: string | null;
  category: string | null;
  owner: string | null;
  company: string | null;
  createDate: Date;
  pipelineStage: string | null;
}