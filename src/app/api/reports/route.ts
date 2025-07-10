import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Interface phù hợp với Prisma schema
interface Ticket {
  id: string;
  subject: string | null;
  content: string | null;
  category: any;
  owner: string | null;
  company: string | null;
  createDate: Date;
  pipelineStage: string | null;
  sourceType: string | null;
  supportObject: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Report {
  id: string;
  ticketIds: any; // JSON type trong Prisma
  content: string;
  startDate: Date;
  endDate: Date;
  prompt: string;
  type: string;
  createdAt: Date;
}

/**
 * Tạo báo cáo AI từ tickets
 * @param request - Request object chứa thông tin báo cáo
 * @returns Response với báo cáo đã tạo
 */
export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, prompt, type = 'custom' } = await request.json();
    
    // Validation input
    if (!startDate || !endDate || !prompt) {
      return NextResponse.json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: startDate, endDate, prompt'
      }, { status: 400 });
    }
    
    // Kiểm tra ngày hợp lệ
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({
        success: false,
        message: 'Định dạng ngày không hợp lệ'
      }, { status: 400 });
    }
    
    if (start >= end) {
      return NextResponse.json({
        success: false,
        message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
      }, { status: 400 });
    }
    
    // Lấy tickets trong khoảng thời gian
    const tickets = await prisma.ticket.findMany({
      where: {
        createDate: {
          gte: start,
          lte: end
        }
      },
      orderBy: { createDate: 'desc' }
    });
    
    if (tickets.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Không có tickets trong khoảng thời gian này'
      }, { status: 400 });
    }
    
    // Chuẩn bị dữ liệu cho AI
    const ticketSummary = tickets.map((ticket: Ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      content: ticket.content?.substring(0, 200) + '...',
      category: ticket.category,
      owner: ticket.owner,
      company: ticket.company,
      createDate: ticket.createDate,
      pipelineStage: ticket.pipelineStage
    }));
    
    // Tạo prompt cho AI
    const aiPrompt = `
${prompt}

Dữ liệu tickets (${tickets.length} tickets từ ${startDate} đến ${endDate}):
${JSON.stringify(ticketSummary, null, 2)}

Hãy phân tích và tạo báo cáo chi tiết bằng tiếng Việt.
    `;
    
    // Gọi Gemini Flash 2.5 với timeout
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Timeout cho AI request
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), 30000); // 30s timeout
    });
    
    const aiPromise = model.generateContent(aiPrompt);
    
    try {
      // Interface cho Gemini result
      interface GeminiResult {
        response: {
          text(): string;
        };
      }
      
      const result = await Promise.race([aiPromise, timeoutPromise]) as GeminiResult;
      const reportContent = result.response.text();
    
      // Lưu báo cáo vào database
      const report = await prisma.report.create({
        data: {
          ticketIds: tickets.map((t: Ticket) => t.id),
          content: reportContent,
          startDate: start,
          endDate: end,
          prompt,
          type
        }
      });
      
      // Đóng kết nối Prisma
      await prisma.$disconnect();
      
      // Trả về cấu trúc nhất quán với GET
      return NextResponse.json({
        success: true,
        message: 'Báo cáo đã được tạo thành công',
        data: {
          ...report,
          ticketCount: tickets.length
        }
      });
      
    } catch (aiError) {
      console.error('Lỗi AI generation:', aiError);
      await prisma.$disconnect();
      return NextResponse.json({
        success: false,
        message: 'Lỗi tạo báo cáo AI: ' + (aiError instanceof Error ? aiError.message : 'Unknown error')
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Lỗi tạo báo cáo:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { success: false, message: 'Lỗi tạo báo cáo AI' },
      { status: 500 }
    );
  }
}

/**
 * Lấy danh sách báo cáo
 * @param request - Request object với query parameters
 * @returns Response với danh sách báo cáo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    
    const skip = (page - 1) * limit;
    const where = type ? { type } : {};
    
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.report.count({ where })
    ]);
    
    // Thêm ticketCount cho mỗi báo cáo
    const reportsWithCount = reports.map((report: Report) => ({
      ...report,
      ticketCount: Array.isArray(report.ticketIds) ? report.ticketIds.length : 0
    }));
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      data: {
        reports: reportsWithCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Lỗi lấy danh sách báo cáo:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { success: false, message: 'Lỗi lấy danh sách báo cáo' },
      { status: 500 }
    );
  }
}

/**
 * Xóa báo cáo
 * @param request - Request object
 * @returns Response xác nhận xóa
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Thiếu ID báo cáo'
      }, { status: 400 });
    }
    
    // Kiểm tra báo cáo có tồn tại không
    const existingReport = await prisma.report.findUnique({
      where: { id }
    });
    
    if (!existingReport) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy báo cáo'
      }, { status: 404 });
    }
    
    // Xóa báo cáo
    await prisma.report.delete({
      where: { id }
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Đã xóa báo cáo thành công'
    });
    
  } catch (error) {
    console.error('Lỗi xóa báo cáo:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { success: false, message: 'Lỗi xóa báo cáo' },
      { status: 500 }
    );
  }
}