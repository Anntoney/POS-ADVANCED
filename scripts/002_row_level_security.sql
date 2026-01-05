-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories policies (all authenticated users can read, only admins/managers can write)
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create categories" ON categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update categories" ON categories FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete categories" ON categories FOR DELETE USING (auth.uid() IS NOT NULL);

-- Units policies
CREATE POLICY "Anyone can view units" ON units FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create units" ON units FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update units" ON units FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete units" ON units FOR DELETE USING (auth.uid() IS NOT NULL);

-- Products policies
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create products" ON products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update products" ON products FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete products" ON products FOR DELETE USING (auth.uid() IS NOT NULL);

-- Product images policies
CREATE POLICY "Anyone can view product images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create product images" ON product_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete product images" ON product_images FOR DELETE USING (auth.uid() IS NOT NULL);

-- Customers policies
CREATE POLICY "Authenticated users can view customers" ON customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create customers" ON customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update customers" ON customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete customers" ON customers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers" ON suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create suppliers" ON suppliers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update suppliers" ON suppliers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete suppliers" ON suppliers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Sales policies
CREATE POLICY "Authenticated users can view sales" ON sales FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create sales" ON sales FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sales" ON sales FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sales" ON sales FOR DELETE USING (auth.uid() IS NOT NULL);

-- Sale items policies
CREATE POLICY "Authenticated users can view sale items" ON sale_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create sale items" ON sale_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sale items" ON sale_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sale items" ON sale_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Purchases policies
CREATE POLICY "Authenticated users can view purchases" ON purchases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create purchases" ON purchases FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update purchases" ON purchases FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete purchases" ON purchases FOR DELETE USING (auth.uid() IS NOT NULL);

-- Purchase items policies
CREATE POLICY "Authenticated users can view purchase items" ON purchase_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create purchase items" ON purchase_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update purchase items" ON purchase_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete purchase items" ON purchase_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Sale returns policies
CREATE POLICY "Authenticated users can view sale returns" ON sale_returns FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create sale returns" ON sale_returns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sale returns" ON sale_returns FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sale returns" ON sale_returns FOR DELETE USING (auth.uid() IS NOT NULL);

-- Sale return items policies
CREATE POLICY "Authenticated users can view sale return items" ON sale_return_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create sale return items" ON sale_return_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sale return items" ON sale_return_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Purchase returns policies
CREATE POLICY "Authenticated users can view purchase returns" ON purchase_returns FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create purchase returns" ON purchase_returns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update purchase returns" ON purchase_returns FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete purchase returns" ON purchase_returns FOR DELETE USING (auth.uid() IS NOT NULL);

-- Purchase return items policies
CREATE POLICY "Authenticated users can view purchase return items" ON purchase_return_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create purchase return items" ON purchase_return_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete purchase return items" ON purchase_return_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Quotations policies
CREATE POLICY "Authenticated users can view quotations" ON quotations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create quotations" ON quotations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update quotations" ON quotations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete quotations" ON quotations FOR DELETE USING (auth.uid() IS NOT NULL);

-- Quotation items policies
CREATE POLICY "Authenticated users can view quotation items" ON quotation_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create quotation items" ON quotation_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update quotation items" ON quotation_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete quotation items" ON quotation_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Expenses policies
CREATE POLICY "Authenticated users can view expenses" ON expenses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update expenses" ON expenses FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete expenses" ON expenses FOR DELETE USING (auth.uid() IS NOT NULL);

-- Currencies policies
CREATE POLICY "Anyone can view currencies" ON currencies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create currencies" ON currencies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update currencies" ON currencies FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete currencies" ON currencies FOR DELETE USING (auth.uid() IS NOT NULL);

-- Stock adjustments policies
CREATE POLICY "Authenticated users can view stock adjustments" ON stock_adjustments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create stock adjustments" ON stock_adjustments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- System settings policies (admin only for updates, everyone can read)
CREATE POLICY "Anyone can view system settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create system settings" ON system_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update system settings" ON system_settings FOR UPDATE USING (auth.uid() IS NOT NULL);
