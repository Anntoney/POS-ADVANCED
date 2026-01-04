-- Insert default units
INSERT INTO units (name, short_name) VALUES
  ('Piece', 'pc'),
  ('Kilogram', 'kg'),
  ('Gram', 'g'),
  ('Liter', 'L'),
  ('Milliliter', 'ml'),
  ('Meter', 'm'),
  ('Centimeter', 'cm'),
  ('Box', 'box'),
  ('Pack', 'pack'),
  ('Dozen', 'dz')
ON CONFLICT DO NOTHING;

-- Insert default currency
INSERT INTO currencies (code, name, symbol, exchange_rate, is_default) VALUES
  ('USD', 'US Dollar', '$', 1.0000, true)
ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('company_name', 'My POS Business'),
  ('company_email', 'info@mypos.com'),
  ('company_phone', '+1234567890'),
  ('company_address', '123 Business Street'),
  ('tax_rate', '0'),
  ('currency_code', 'USD'),
  ('low_stock_alert', 'true'),
  ('receipt_footer', 'Thank you for your business!')
ON CONFLICT (setting_key) DO NOTHING;
