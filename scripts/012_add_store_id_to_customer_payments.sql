-- Add store_id to customer_payments table for multi-store support
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Update existing customer_payments to have store_id based on customer's store_id
UPDATE customer_payments cp
SET store_id = c.store_id
FROM customers c
WHERE cp.customer_id = c.id
  AND cp.store_id IS NULL
  AND c.store_id IS NOT NULL;

-- If any payments still have NULL store_id, assign to default store
DO $$
DECLARE
  default_store_id UUID;
BEGIN
  SELECT id INTO default_store_id FROM stores WHERE is_active = true ORDER BY created_at ASC LIMIT 1;
  
  IF default_store_id IS NOT NULL THEN
    UPDATE customer_payments SET store_id = default_store_id WHERE store_id IS NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_store ON customer_payments(store_id);
