-- Create user permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  can_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature)
);

-- Create index for better performance
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_feature ON user_permissions(feature);

-- Enable Row Level Security
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for user permissions
CREATE POLICY "Users can view all permissions" ON user_permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage permissions" ON user_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Insert default permissions for existing users (all features enabled)
INSERT INTO user_permissions (user_id, feature, can_access)
SELECT 
  id,
  feature,
  true
FROM profiles
CROSS JOIN (
  VALUES 
    ('dashboard'),
    ('pos'),
    ('products'),
    ('categories'),
    ('stock'),
    ('sales'),
    ('purchases'),
    ('returns'),
    ('customers'),
    ('suppliers'),
    ('credit'),
    ('quotations'),
    ('expenses'),
    ('reports'),
    ('settings')
) AS features(feature)
ON CONFLICT (user_id, feature) DO NOTHING;
