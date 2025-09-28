import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// إعدادات Pool محسنة لـ Supabase
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // حد أقصى للاتصالات
  idleTimeoutMillis: 30000, // 30 ثانية قبل إغلاق الاتصال الخامل
  connectionTimeoutMillis: 2000, // مهلة زمنية للاتصال
});

// معالجة أخطاء Pool
pool.on('error', (err) => {
  console.error('🚨 Database pool error:', err);
});

pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('remove', () => {
  console.log('🔌 Database connection removed from pool');
});

export const db = drizzle(pool, { schema });

// اختبار الاتصال عند بدء التطبيق
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection test failed:', err);
  } else {
    console.log('✅ Database connection test successful:', res.rows[0]);
  }
});

// Export schema for use in queries
export * from '../shared/schema';