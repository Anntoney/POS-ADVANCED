-- Add wholesale_price column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10, 2) DEFAULT 0;

-- Make SKU, barcode, unit_id, tax_rate, min_stock_level, description nullable
-- (They are already nullable except SKU, so we'll make SKU nullable)
ALTER TABLE products ALTER COLUMN sku DROP NOT NULL;
ALTER TABLE products ALTER COLUMN barcode DROP NOT NULL;
