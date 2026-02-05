-- Fix Profile Auto-Creation Trigger
-- Run this script in your Supabase SQL Editor

-- Step 1: Add INSERT policy for profiles (needed for trigger)
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles" 
ON profiles 
FOR INSERT 
WITH CHECK (true);

-- Step 2: Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'admin'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Step 3: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Fix existing user (replace with your user's email)
-- Get the user ID and create profile if missing
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
      'admin',
      true
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created profile for user: %', user_record.email;
  END LOOP;
END $$;

-- Step 5: Verify the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 6: Verify profiles were created
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_active,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC;
