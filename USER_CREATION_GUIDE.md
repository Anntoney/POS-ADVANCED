# User Creation Without Email Verification

## What Changed

The system now creates users directly without requiring email verification. This bypasses Supabase's email rate limits.

## How It Works

1. **Admin API**: Uses Supabase Admin API with service role key to create users
2. **Auto-Confirm**: Users are automatically confirmed (no email needed)
3. **Immediate Access**: Users can login right away with their credentials
4. **Profile Creation**: Profile is created automatically via trigger
5. **Auto-Login**: After signup, users are automatically logged in

## Creating Users

### Via Public Signup Page (Anyone Can Use)

1. Go to `/auth/signup` or click "Sign up" from login page
2. Fill in the form:
   - Full Name
   - Email
   - Password (minimum 6 characters)
   - Role (Admin/Manager/Cashier)
3. Click **Sign up**
4. You'll be automatically logged in and redirected to dashboard

**No email verification needed!**

### Via Settings UI (Admin Only)

1. Login as an admin user
2. Go to **Settings** → **User Management** tab
3. Click **Create User**
4. Fill in the form:
   - Full Name
   - Email
   - Password (minimum 6 characters)
   - Role (Admin/Manager/Cashier)
   - Store Assignment (optional)
   - Active status
5. Click **Create User**

The user can now login immediately with the email and password you provided.

### Via SQL (Alternative)

If you need to create users directly in the database:

```sql
-- 1. Create auth user (using admin API is preferred)
-- This should be done via the API route

-- 2. Or manually create profile only (for testing)
INSERT INTO public.profiles (id, email, full_name, role, is_active)
VALUES (
  gen_random_uuid(),  -- Generate a UUID
  'user@example.com',
  'User Name',
  'admin',
  true
);
```

## Important Notes

- **Service Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.local`
- **Admin Only**: Only users with `role = 'admin'` can create new users
- **Security**: The service role key bypasses RLS, so it's only used in secure API routes
- **No Email Limits**: This method doesn't send emails, so you won't hit rate limits

## Troubleshooting

### "Only admins can create users" error
- Make sure you're logged in as an admin
- Check your profile: `SELECT * FROM profiles WHERE id = auth.uid()`

### "Missing Supabase admin environment variables" error
- Verify `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- Restart your dev server after adding the key

### User created but can't login
- Check if profile was created: `SELECT * FROM profiles WHERE email = 'user@example.com'`
- Verify user is active: `is_active = true`
- Run the fix_profile_trigger.sql script to ensure trigger is working

## First Time Setup

If you don't have any admin users yet:

1. Run `scripts/fix_profile_trigger.sql` in Supabase SQL Editor
2. This will:
   - Fix the trigger
   - Create profiles for existing auth users
   - Set them as admins by default
3. Login with your existing credentials
4. You can now create more users via the UI
