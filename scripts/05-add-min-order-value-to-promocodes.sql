-- Add min_order_value column to promocodes table if it does not exist
ALTER TABLE promocodes ADD COLUMN IF NOT EXISTS min_order_value DECIMAL(10,2) DEFAULT 0;
