import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

try {
  const client = await pool.connect();
  
  console.log('🔍 Checking users table...');
  
  // Check if users table exists
  const tableExists = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    );
  `);
  
  console.log('Users table exists:', tableExists.rows[0].exists);
  
  if (tableExists.rows[0].exists) {
    // Get count of users
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log('Total users in database:', userCount.rows[0].count);
    
    // Get all users
    const allUsers = await client.query('SELECT id, email, "fullName", role, status FROM users ORDER BY "createdAt" DESC');
    console.log('Users in database:');
    allUsers.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.email}) - ${user.role} - ${user.status}`);
    });
  }
  
  client.release();
  await pool.end();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}