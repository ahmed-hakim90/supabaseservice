import { db } from './db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Database connection successful!');
    console.log('Current time:', (result as any)[0]?.current_time); // Type assertion to fix the error
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function initDatabase() {
  console.log('Creating database tables...');
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Create enums
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'technician', 'receptionist', 'warehouse_manager', 'customer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE service_request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        role user_role NOT NULL DEFAULT 'customer',
        status user_status NOT NULL DEFAULT 'pending',
        center_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create service_centers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS service_centers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        manager_id UUID,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create customers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        center_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create products table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        model TEXT,
        category_id UUID NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create service_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS service_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_number TEXT NOT NULL UNIQUE,
        customer_id UUID NOT NULL,
        product_id UUID NOT NULL,
        device_name TEXT NOT NULL,
        model TEXT,
        issue TEXT NOT NULL,
        status service_request_status NOT NULL DEFAULT 'pending',
        center_id UUID NOT NULL,
        technician_id UUID,
        estimated_cost INTEGER,
        actual_cost INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);

    // Create service_request_follow_ups table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS service_request_follow_ups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_request_id UUID NOT NULL,
        technician_id UUID NOT NULL,
        follow_up_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create warehouses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS warehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        manager_id UUID,
        center_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create spare_parts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spare_parts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        part_number TEXT NOT NULL UNIQUE,
        category_id UUID,
        price INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create inventory table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id UUID NOT NULL,
        spare_part_id UUID NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        min_quantity INTEGER DEFAULT 5,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create product_inventory table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS product_inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        min_quantity INTEGER DEFAULT 5,
        last_restock_date TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create parts_transfers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS parts_transfers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_warehouse_id UUID NOT NULL,
        to_warehouse_id UUID NOT NULL,
        spare_part_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        status transfer_status NOT NULL DEFAULT 'pending',
        requested_by UUID NOT NULL,
        approved_by UUID,
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create activity_logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database tables created successfully!');
    
    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    // Insert initial admin user
    await db.execute(sql`
      INSERT INTO users (email, password, full_name, phone, role, status)
      VALUES ('admin@sokany.com', ${hashedPassword}, 'مدير النظام', '+966501234567', 'admin', 'active')
      ON CONFLICT (email) DO NOTHING
    `);
    
    console.log('✅ Initial admin user created: admin@sokany.com / Admin123!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Run if called directly
initDatabase()
  .then(() => {
    console.log('Database initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });

export { initDatabase };