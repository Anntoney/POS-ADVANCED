-- Add DELETE policy for stock_transfers (admin only)
CREATE POLICY "Admins can delete stock transfers" ON stock_transfers 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
