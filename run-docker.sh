#!/bin/bash

# Script đơn giản để chạy Docker
echo "🚀 Starting Ticket Support System..."

# Kiểm tra file .env
if [ ! -f ".env" ]; then
    echo "❌ File .env không tồn tại!"
    echo "📝 Vui lòng tạo file .env với các biến môi trường cần thiết."
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Tạo thư mục logs
mkdir -p logs

# Dừng containers cũ nếu có
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.simple.yml down

# Xóa images cũ để build lại
echo "🧹 Cleaning up old images..."
docker-compose -f docker-compose.simple.yml build --no-cache

# Build và start
echo "📦 Starting containers..."
docker-compose -f docker-compose.simple.yml up -d

# Chờ database khởi động
echo "⏳ Waiting for database..."
sleep 20

# Kiểm tra database connection
echo "🔍 Checking database connection..."
until docker-compose -f docker-compose.simple.yml exec postgres pg_isready -U $POSTGRES_USER; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "Database is ready!"

# Chạy migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.simple.yml exec app npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi

# Seed database với prompts mẫu
echo "🌱 Seeding database with sample prompts..."
docker-compose -f docker-compose.simple.yml exec app npm run db:seed:prod

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully with sample prompts!"
else
    echo "⚠️  Seeding failed, trying alternative method..."
    docker-compose -f docker-compose.simple.yml exec app node -r esbuild-register prisma/seed.ts
fi

echo "✅ Setup completed!"
echo "🌐 Application: http://localhost:$PORT"
echo "🗄️  Database: localhost:5432"
echo "📋 Logs: docker-compose -f docker-compose.simple.yml logs -f"
echo "🛑 Stop: docker-compose -f docker-compose.simple.yml down"
echo "📝 Sample prompts have been added to the database!"