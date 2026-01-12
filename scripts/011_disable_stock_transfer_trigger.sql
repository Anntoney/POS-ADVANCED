-- Disable the stock transfer trigger since we're handling stock movement in application code
-- This prevents duplicate operations and duplicate key errors

DROP TRIGGER IF EXISTS on_stock_transfer_completed ON stock_transfers;

-- Optional: Drop the function as well if not needed
-- DROP FUNCTION IF EXISTS complete_stock_transfer();
