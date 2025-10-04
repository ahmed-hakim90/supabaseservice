-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'technician', 'receptionist', 'warehouse_manager', 'customer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE service_request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE parts_transfer_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  status user_status NOT NULL DEFAULT 'pending',
  center_id UUID,
  warehouse_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create service_centers table
CREATE TABLE service_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  center_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT,
  category_id UUID NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create service_requests table
CREATE TABLE service_requests (
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
);

-- Create service_request_follow_ups table
CREATE TABLE service_request_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  follow_up_text TEXT NOT NULL,
  new_status service_request_status,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create warehouses table
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  manager_id UUID,
  center_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create spare_parts table
CREATE TABLE spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  part_number TEXT UNIQUE,
  category_id UUID,
  product_id UUID,
  price INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL,
  spare_part_id UUID NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  last_restock_date TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create product_inventory table
CREATE TABLE product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  last_restock_date TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create parts_transfers table
CREATE TABLE parts_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_warehouse_id UUID NOT NULL,
  to_warehouse_id UUID NOT NULL,
  spare_part_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  status parts_transfer_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial data with hashed passwords
INSERT INTO users (email, password, full_name, phone, role, status, center_id) VALUES
('admin@sokany.com', '$2b$10$OEwUHTA2mM5n7gfl9cUmtuFuFDoMo3nxPkMhkCZVz4VU1ldADdwhO', 'مدير النظام', '+966501234567', 'admin', 'active', NULL),
('manager@sokany.com', '$2b$10$/.kGkLZcMyHpy6akxCaVg.OS5EpB/8A62y/6//vSNqMYKYBFX9xwm', 'مدير المركز', '+966501234568', 'manager', 'active', (SELECT id FROM service_centers WHERE name = 'مركز الرياض الرئيسي')),
('tech@sokany.com', '$2b$10$hkCVKCmfcdt4JPvHRKgwh.TBHm/ok0syInjHd/DaMJPIYPqs22dcy', 'فني الصيانة', '+966501234569', 'technician', 'active', (SELECT id FROM service_centers WHERE name = 'مركز الرياض الرئيسي')),
('customer@sokany.com', '$2b$10$.TODrPUutIDUIucpD9/LDedbkUyL9Z/t.9UVLgI.GAOduibEl6bN2', 'عميل تجريبي', '+966501234570', 'customer', 'active', (SELECT id FROM service_centers WHERE name = 'مركز الرياض الرئيسي'));

INSERT INTO service_centers (name, address, phone, email) VALUES
('مركز الرياض الرئيسي', 'الرياض، حي الملك فهد', '+966112345678', 'riyadh@sokany.com'),
('مركز جدة', 'جدة، حي الروضة', '+966122345678', 'jeddah@sokany.com');

INSERT INTO categories (name, description) VALUES
('أجهزة المنزل', 'أجهزة كهربائية منزلية'),
('إلكترونيات', 'أجهزة إلكترونية متنوعة');

INSERT INTO products (name, model, category_id, description) VALUES
('غسالة أتوماتيك', 'WM-2024', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), 'غسالة أتوماتيك 10 كيلو'),
('مكيف هواء', 'AC-2024', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), 'مكيف سبليت 2 طن');

INSERT INTO customers (full_name, phone, email, address, center_id) VALUES
('خالد السعيد', '+966501111111', 'khalid@example.com', 'الرياض، حي النخيل', (SELECT id FROM service_centers WHERE name = 'مركز الرياض الرئيسي')),
('فاطمة الزهراء', '+966502222222', 'fatima@example.com', 'جدة، حي البلد', (SELECT id FROM service_centers WHERE name = 'مركز جدة'));

INSERT INTO warehouses (name, location, center_id) VALUES
('مخزن الرياض الرئيسي', 'الرياض - المستودعات الرئيسية', (SELECT id FROM service_centers WHERE name = 'مركز الرياض الرئيسي')),
('مخزن جدة الفرعي', 'جدة - منطقة المستودعات', (SELECT id FROM service_centers WHERE name = 'مركز جدة'));

-- Create user_approvals table
CREATE TABLE user_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  approved_by UUID NOT NULL REFERENCES users(id),
  role user_role NOT NULL,
  center_id UUID,
  warehouse_id UUID,
  notes TEXT,
  approved_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_approvals_user_id ON user_approvals(user_id);
CREATE INDEX idx_user_approvals_approved_by ON user_approvals(approved_by);
CREATE INDEX idx_users_warehouse_id ON users(warehouse_id); 

-- Insert sample spare parts linked to products
INSERT INTO spare_parts (name, part_number, category_id, product_id, price, description) VALUES
-- قطع غيار لمكيف شباك سوكاني
('مروحة المكيف', 'AC-FAN-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'مكيف هواء'), 150, 'مروحة داخلية للمكيف'),
('مكثف المكيف', 'AC-COND-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'مكيف هواء'), 300, 'مكثف خارجي للمكيف'),
('لوحة تحكم المكيف', 'AC-BOARD-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'مكيف هواء'), 200, 'لوحة إلكترونية للتحكم'),

-- قطع غيار لغسالة أتوماتيك
('محرك الغسالة', 'WM-MOTOR-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'غسالة أتوماتيك'), 400, 'محرك كهربائي للغسالة'),
('مضخة الغسالة', 'WM-PUMP-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'غسالة أتوماتيك'), 180, 'مضخة صرف المياه'),
('حساس الغسالة', 'WM-SENSOR-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'غسالة أتوماتيك'), 120, 'حساس مستوى المياه'),

-- قطع غيار عامة (غير مرتبطة بمنتج محدد)
('كيبل كهربائي 3 متر', 'CABLE-3M', NULL, NULL, 50, 'كيبل كهربائي معزول'),
('مفتاح كهربائي', 'SWITCH-001', NULL, NULL, 25, 'مفتاح تشغيل/إيقاف'),
('صمام غاز', 'VALVE-GAS-001', NULL, NULL, 75, 'صمام أمان للغاز');

-- Create spare_parts_scrap table
CREATE TABLE spare_parts_scrap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  spare_part_id UUID NOT NULL,
  service_request_id UUID,
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL,
  FOREIGN KEY (center_id) REFERENCES service_centers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id),
  FOREIGN KEY (service_request_id) REFERENCES service_requests(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create spare_parts_shortages table
CREATE TABLE spare_parts_shortages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  spare_part_id UUID NOT NULL,
  quantity_needed INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMP,
  FOREIGN KEY (center_id) REFERENCES service_centers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
);

-- Create indexes for the new tables
CREATE INDEX idx_spare_parts_scrap_center_id ON spare_parts_scrap(center_id);
CREATE INDEX idx_spare_parts_scrap_warehouse_id ON spare_parts_scrap(warehouse_id);
CREATE INDEX idx_spare_parts_scrap_spare_part_id ON spare_parts_scrap(spare_part_id);
CREATE INDEX idx_spare_parts_scrap_created_at ON spare_parts_scrap(created_at);

CREATE INDEX idx_spare_parts_shortages_center_id ON spare_parts_shortages(center_id);
CREATE INDEX idx_spare_parts_shortages_warehouse_id ON spare_parts_shortages(warehouse_id);
CREATE INDEX idx_spare_parts_shortages_spare_part_id ON spare_parts_shortages(spare_part_id);
CREATE INDEX idx_spare_parts_shortages_status ON spare_parts_shortages(status);

-- Sales table (مبيعات قطع الغيار)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  center_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  total_amount INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (center_id) REFERENCES service_centers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- Sale Items table (عناصر البيع)
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  spare_part_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
);

-- Create indexes for sales tables
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_center_id ON sales(center_id);
CREATE INDEX idx_sales_warehouse_id ON sales(warehouse_id);
CREATE INDEX idx_sales_technician_id ON sales(technician_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_spare_part_id ON sale_items(spare_part_id);

-- Create system_settings table for user preferences and system configuration
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for system_settings
CREATE INDEX idx_system_settings_user_id ON system_settings(user_id);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE UNIQUE INDEX idx_system_settings_user_key ON system_settings(user_id, setting_key);