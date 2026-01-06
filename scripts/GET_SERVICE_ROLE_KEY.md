# How to Get Your Supabase Service Role Key

The migration script needs the **Service Role Key** to bypass Row Level Security (RLS) policies when inserting data.

## Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find the **service_role** key (it's under "Project API keys")
5. Copy the key (it starts with `eyJ...`)

## Add to .env.local:

Add this line to your `.env.local` file:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important Security Note:**
- The service role key has full access to your database and bypasses all RLS policies
- **Never commit this key to version control**
- **Never expose it in client-side code**
- Only use it for server-side operations like migrations

## After Adding the Key:

Run the migration again:
```bash
npm run migrate:mysql
```
