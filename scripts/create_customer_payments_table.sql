-- Create customer_payments table to track credit payments
CREATE TABLE IF NOT EXISTS customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'cheque')),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view customer payments"
  ON customer_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create customer payments"
  ON customer_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customer payments"
  ON customer_payments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete customer payments"
  ON customer_payments FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_customer_payments_customer ON customer_payments(customer_id);
CREATE INDEX idx_customer_payments_sale ON customer_payments(sale_id);
CREATE INDEX idx_customer_payments_date ON customer_payments(payment_date);
