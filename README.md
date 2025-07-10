# 🚀 Hướng dẫn khởi tạo project Next.js Ticket Support lần đầu

## 📋 Yêu cầu hệ thống
- **Node.js**: >= 18.0.0
- **npm** hoặc **yarn**
- **Database**: PostgreSQL hoặc MySQL
- **MacBook Pro M1**: Đã tối ưu cho chip Apple Silicon

## 🔧 Các bước khởi tạo

### 1. Clone và di chuyển vào thư mục project
```bash
cd /Users/mvng/Desktop/Nextjs-Ticket/next-ticket-support
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Tạo file môi trường
```bash
cp .env.example .env.local
```

### 4. Cấu hình file .env.local
Mở file `.env.local` và cập nhật các biến môi trường:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ticket_support"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# HubSpot (nếu có)
HUBSPOT_ACCESS_TOKEN="your-hubspot-token"

# OpenAI (cho AI reports)
OPENAI_API_KEY="your-openai-api-key"
```

### 5. Setup Database với Prisma

#### Tạo database mới:
```bash
# Tạo database (PostgreSQL)
createb ticket_support
```

#### Chạy migrations:
```bash
npx prisma migrate dev
```

#### Tạo Prisma Client:
```bash
npx prisma generate
```

### 6. Seed dữ liệu mẫu
```bash
npx prisma db seed
```

### 7. Chạy development server
```bash
npm run dev
```

## 🌐 Truy cập ứng dụng

Mở trình duyệt và truy cập: **http://localhost:3000**

## 📁 Cấu trúc project sau khi setup

```
next-ticket-support/
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts          # Dữ liệu mẫu
│   └── migrations/      # Database migrations
├── src/
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── tickets/     # Trang quản lý tickets
│   │   ├── reports/     # Trang báo cáo AI
│   │   └── sync/        # Trang đồng bộ HubSpot
│   ├── components/      # React components
│   ├── lib/            # Utilities
│   └── types/          # TypeScript types
└── .env.local          # Biến môi trường
```

## 🔍 Kiểm tra setup thành công

### 1. Kiểm tra database:
```bash
npx prisma studio
```

### 2. Kiểm tra API endpoints:
- **GET** `/api/tickets` - Danh sách tickets
- **GET** `/api/reports` - Danh sách báo cáo
- **GET** `/api/prompts` - Prompt templates

### 3. Kiểm tra các trang chính:
- **Tickets**: http://localhost:3000/tickets
- **Reports**: http://localhost:3000/reports
- **Sync**: http://localhost:3000/sync

## 🛠️ Lệnh hữu ích khác

```bash
# Reset database và chạy lại migrations
npx prisma migrate reset

# Xem database trong Prisma Studio
npx prisma studio

# Build production
npm run build

# Chạy production server
npm start

# Kiểm tra linting
npm run lint

# Format code
npm run format
```

## ⚠️ Lưu ý quan trọng

1. **Database URL**: Đảm bảo database đã được tạo và connection string đúng
2. **Environment Variables**: Tất cả biến môi trường cần thiết phải được cấu hình
3. **Seed Data**: Chạy seed để có prompt templates mặc định cho AI reports
4. **Port 3000**: Đảm bảo port 3000 không bị sử dụng bởi ứng dụng khác

## 🎉 Hoàn thành!

Sau khi hoàn thành các bước trên, bạn đã có một hệ thống Ticket Support hoàn chỉnh với:
- ✅ Quản lý tickets
- ✅ Báo cáo AI với prompt templates
- ✅ Đồng bộ HubSpot
- ✅ Database đã được setup
- ✅ Dữ liệu mẫu đã được tạo

Chúc bạn phát triển thành công! 🚀
        