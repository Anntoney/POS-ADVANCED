-- Fix store trigger to exclude current store from count when updating
-- This fixes the issue where editing an active store incorrectly triggers the limit error

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

-- Recreate the trigger
DROP TRIGGER IF EXISTS enforce_max_stores ON stores;
CREATE TRIGGER enforce_max_stores
  BEFORE INSERT OR UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION check_max_stores();
