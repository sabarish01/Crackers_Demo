-- Add promo_code column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_promo_code ON orders(promo_code);
