import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Ticket } from '@/types/ticket';

/**
 * Quản lý kết nối và thao tác với SQLite database
 */
class DatabaseManager {
  public db: Database.Database; // Thay đổi từ private thành public
  private static instance: DatabaseManager;

  private constructor() {
    // Tạo thư mục data nếu chưa tồn tại
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Đã tạo thư mục data:', dataDir);
    }
    
    // Tạo file database trong thư mục data
    const dbPath = path.join(dataDir, 'database.sqlite');
    console.log('Database path:', dbPath);
    
    try {
      this.db = new Database(dbPath);
      console.log('Kết nối database thành công');
      this.initializeTables();
    } catch (error) {
      console.error('Lỗi khi kết nối database:', error);
      throw error;
    }
  }

  /**
   * Singleton pattern để đảm bảo chỉ có một instance
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Khởi tạo bảng tickets nếu chưa tồn tại
   */
  private initializeTables(): void {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tickets (
          id TEXT PRIMARY KEY,
          category_value TEXT,
          category_label TEXT,
          owner_id TEXT,
          owner_name TEXT,
          company_name TEXT,
          subject TEXT,
          source_type TEXT,
          content TEXT,
          pipeline_stage_value TEXT,
          pipeline_stage_label TEXT,
          support_object_value TEXT,
          support_object_label TEXT,
          created_date TEXT,
          synced_at TEXT,
          UNIQUE(id)
        )
      `;
      
      this.db.exec(createTableQuery);
      console.log('Bảng tickets đã được tạo/kiểm tra');
      
      // Tạo index cho các trường thường được query
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_created_date ON tickets(created_date)');
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_company_name ON tickets(company_name)');
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_owner_id ON tickets(owner_id)');
      console.log('Indexes đã được tạo');
    } catch (error) {
      console.error('Lỗi khi khởi tạo bảng:', error);
      throw error;
    }
  }

  /**
   * Lưu hoặc cập nhật ticket
   */
  public upsertTicket(ticket: Ticket): void {
    try {
      const query = `
        INSERT OR REPLACE INTO tickets (
          id, category_value, category_label, owner_id, owner_name,
          company_name, subject, source_type, content, pipeline_stage_value,
          pipeline_stage_label, support_object_value, support_object_label,
          created_date, synced_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;
      
      const stmt = this.db.prepare(query);
      const result = stmt.run(
        ticket.id,
        ticket.category_value,
        ticket.category_label,
        ticket.owner_id,
        ticket.owner_name,
        ticket.company_name,
        ticket.subject,
        ticket.source_type,
        ticket.content,
        ticket.pipeline_stage_value,
        ticket.pipeline_stage_label,
        ticket.support_object_value,
        ticket.support_object_label,
        ticket.created_date,
        ticket.synced_at
      );
      
      console.log(`Ticket ${ticket.id} đã được lưu, changes: ${result.changes}`);
    } catch (error) {
      console.error('Lỗi khi lưu ticket:', error);
      throw error;
    }
  }

  /**
   * Lưu nhiều tickets trong một transaction
   */
  public upsertTickets(tickets: Ticket[]): void {
    try {
      console.log(`Bắt đầu lưu ${tickets.length} tickets...`);
      
      const transaction = this.db.transaction((tickets: Ticket[]) => {
        for (const ticket of tickets) {
          this.upsertTicket(ticket);
        }
      });
      
      transaction(tickets);
      console.log(`Đã lưu thành công ${tickets.length} tickets`);
    } catch (error) {
      console.error('Lỗi khi lưu nhiều tickets:', error);
      throw error;
    }
  }

  /**
   * Lấy ticket theo ID
   */
  public getTicketById(id: string): Ticket | null {
    const query = 'SELECT * FROM tickets WHERE id = ?';
    const stmt = this.db.prepare(query);
    return stmt.get(id) as Ticket | null;
  }

  /**
   * Lấy tất cả tickets với phân trang
   */
  public getTickets(limit: number = 50, offset: number = 0): Ticket[] {
    const query = 'SELECT * FROM tickets ORDER BY created_date DESC LIMIT ? OFFSET ?';
    const stmt = this.db.prepare(query);
    return stmt.all(limit, offset) as Ticket[];
  }

  /**
   * Đếm tổng số tickets
   */
  public getTicketCount(): number {
    const query = 'SELECT COUNT(*) as count FROM tickets';
    const stmt = this.db.prepare(query);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Kiểm tra kết nối database
   */
  public testConnection(): boolean {
    try {
      const result = this.db.prepare('SELECT 1 as test').get();
      return result !== undefined;
    } catch (error) {
      console.error('Lỗi khi test kết nối:', error);
      return false;
    }
  }

  /**
   * Đóng kết nối database
   */
  public close(): void {
    this.db.close();
  }
}

export default DatabaseManager;