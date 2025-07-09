import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed dữ liệu mẫu cho database
 */
async function main() {
  console.log('🌱 Bắt đầu seed database...');

  // Seed prompts mẫu
  await prisma.prompt.upsert({
    where: { id: 'day' },
    update: {},
    create: {
      id: 'day',
      prompt: 'Hãy đọc danh sách các ticket hôm nay và tóm tắt ngắn gọn những vấn đề tồn đọng, nhóm theo nội dung chính. Viết bằng tiếng Việt, rõ ràng, súc tích, cấu trúc dễ đọc, có đánh số mục nếu cần.'
    }
  });

  await prisma.prompt.upsert({
    where: { id: 'week' },
    update: {},
    create: {
      id: 'week',
      prompt: 'Hãy phân tích các ticket trong tuần qua và đưa ra báo cáo tổng quan về xu hướng, các vấn đề chính và đề xuất cải thiện. Viết bằng tiếng Việt, có cấu trúc rõ ràng với các mục: Tổng quan, Vấn đề chính, Xu hướng, Đề xuất.'
    }
  });

  await prisma.prompt.upsert({
    where: { id: 'month' },
    update: {},
    create: {
      id: 'month',
      prompt: 'Hãy tạo báo cáo tháng về tình hình tickets, bao gồm thống kê, phân tích xu hướng, đánh giá hiệu suất xử lý và đề xuất chiến lược cải thiện cho tháng tới. Viết bằng tiếng Việt, định dạng chuyên nghiệp.'
    }
  });

  console.log('✅ Seed hoàn thành!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });