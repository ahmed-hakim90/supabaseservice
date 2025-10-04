import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Testing database connection...');
console.log('Connection string (partial):', connectionString.substring(0, 50) + '...');

async function testConnection() {
  try {
    const sql = postgres(connectionString!, { // Add ! to assert it's not undefined
      max: 1,
      ssl: 'require',
      idle_timeout: 5,
      connect_timeout: 10
    });
    
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✓ Database connected successfully!');
    console.log('Current database time:', result[0].current_time);
    
    // Close connection
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    process.exit(1);
  }
}

testConnection();