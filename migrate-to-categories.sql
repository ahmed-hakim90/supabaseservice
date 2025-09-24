-- Migration: Change service_requests table from productId to categoryId
-- This script updates the service requests table to use categories instead of products

-- Add the new categoryId column (nullable first)
ALTER TABLE service_requests ADD COLUMN category_id UUID;

-- For existing data, we might need to map products to categories
-- For now, we'll set a default category or leave NULL for manual update

-- Drop the old productId column (be careful with this in production!)
-- ALTER TABLE service_requests DROP COLUMN product_id;

-- If you want to keep the old column for backup, you can rename it instead:
ALTER TABLE service_requests RENAME COLUMN product_id TO product_id_backup;

-- Make the new column NOT NULL after updating data
-- ALTER TABLE service_requests ALTER COLUMN category_id SET NOT NULL;

-- Note: You'll need to manually update existing records to set appropriate category_id values
-- or create a data migration script to map products to categories