-- Multi-Store Support Migration
-- This script adds support for multiple stores (max 2) in the same database

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add store_id to profiles (users can be assigned to a store)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- Add store_id to all relevant tables
ALTER TABLE categories ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE sale_returns ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE purchase_returns ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE stock_adjustments ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Create stock_transfers table for tracking transfers between stores
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_number TEXT UNIQUE NOT NULL,
  from_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  to_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (from_store_id != to_store_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_store ON profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_store ON suppliers(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_purchases_store ON purchases(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_store ON stock_transfers(from_store_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_store ON stock_transfers(to_store_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_product ON stock_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);

-- Enable Row Level Security on stores and stock_transfers
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

-- Stores policies
CREATE POLICY "Anyone can view stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Admins can manage stores" ON stores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Stock transfers policies
CREATE POLICY "Authenticated users can view stock transfers" ON stock_transfers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create stock transfers" ON stock_transfers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update stock transfers" ON stock_transfers FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Function to automatically create default store if none exists
CREATE OR REPLACE FUNCTION create_default_store()
RETURNS UUID AS $$
DECLARE
  default_store_id UUID;
BEGIN
  -- Check if any store exists
  SELECT id INTO default_store_id FROM stores LIMIT 1;
  
  -- If no store exists, create a default one
  IF default_store_id IS NULL THEN
    INSERT INTO stores (name, address, is_active)
    VALUES ('Main Store', 'Default Store Address', true)
    RETURNING id INTO default_store_id;
  END IF;
  
  RETURN default_store_id;
END;
$$ LANGUAGE plpgsql;

-- Create default store if none exists
SELECT create_default_store();

-- Update existing records to have a store_id (assign to default store)
DO $$
DECLARE
  default_store_id UUID;
BEGIN
  SELECT id INTO default_store_id FROM stores LIMIT 1;
  
  IF default_store_id IS NOT NULL THEN
    UPDATE categories SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE products SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE customers SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE suppliers SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE sales SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE purchases SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE sale_returns SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE purchase_returns SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE quotations SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE expenses SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE stock_adjustments SET store_id = default_store_id WHERE store_id IS NULL;
  END IF;
END $$;

-- Function to enforce max 2 stores limit
-- Fixed to exclude current store from count when updating
CREATE OR REPLACE FUNCTION check_max_stores()
RETURNS TRIGGER AS $$
DECLARE
  store_count INTEGER;
BEGIN
  -- Only check limit when activating a store (inserting new active store or activating inactive store)
  -- When updating an already active store, don't check the limit
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    -- Count active stores, excluding the current store being inserted/updated
    SELECT COUNT(*) INTO store_count 
    FROM stores 
    WHERE is_active = true 
    AND id != NEW.id;
    
    IF store_count >= 2 THEN
      RAISE EXCEPTION 'Maximum of 2 active stores allowed. Please deactivate an existing store first.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce max stores limit
DROP TRIGGER IF EXISTS enforce_max_stores ON stores;
CREATE TRIGGER enforce_max_stores
  BEFORE INSERT OR UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION check_max_stores();

-- Function to handle stock transfer completion
CREATE OR REPLACE FUNCTION complete_stock_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Deduct stock from source store
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id 
      AND store_id = NEW.from_store_id
      AND stock_quantity >= NEW.quantity;
    
    -- Add stock to destination store
    -- First check if product exists in destination store
    IF EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND store_id = NEW.to_store_id) THEN
      UPDATE products 
      SET stock_quantity = stock_quantity + NEW.quantity,
          updated_at = NOW()
      WHERE id = NEW.product_id 
        AND store_id = NEW.to_store_id;
    ELSE
      -- If product doesn't exist in destination store, create it
      INSERT INTO products (
        id, name, sku, barcode, category_id, unit_id, description,
        cost_price, selling_price, stock_quantity, min_stock_level, tax_rate,
        is_active, created_by, store_id
      )
      SELECT 
        id, name, sku, barcode, category_id, unit_id, description,
        cost_price, selling_price, NEW.quantity, min_stock_level, tax_rate,
        is_active, created_by, NEW.to_store_id
      FROM products
      WHERE id = NEW.product_id AND store_id = NEW.from_store_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock transfer completion
DROP TRIGGER IF EXISTS on_stock_transfer_completed ON stock_transfers;
CREATE TRIGGER on_stock_transfer_completed
  AFTER UPDATE ON stock_transfers
  FOR EACH ROW
  EXECUTE FUNCTION complete_stock_transfer();
