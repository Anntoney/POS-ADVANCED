# 🚨 Quick Fix - Wrong Supabase Project

## The Problem
Your app is connecting to a different Supabase project than the one in your `.env` file.

## The Solution (3 Steps)

### Step 1: Verify Your .env File
```bash
cd mobileapp
npm run check-env
```

This will show you which Supabase project is configured.

### Step 2: Stop and Clear Cache
If the dev server is running, press `Ctrl+C` to stop it.

Then run:
```bash
npm run start:clear
```

Or:
```bash
npx expo start --clear
```

### Step 3: Reload the App
- **On Device**: Shake your phone and tap "Reload"
- **On Simulator**: Press `R` in the terminal or `Cmd+R` (iOS) / `RR` (Android)

## Verify It's Fixed

Look at the terminal output. You should see:
```
🔧 Supabase Configuration:
URL: https://soqxolezaulotushohjd.supabase.co
Project Ref: soqxolezaulotushohjd
Key (first 20 chars): eyJhbGciOiJIUzI1NiIsI...
```

**Check that the Project Ref matches**: `soqxolezaulotushohjd`

## Still Not Working?

### Option 1: Complete Reset

**Windows (Command Prompt):**
```cmd
REM Stop the server (Ctrl+C)

REM Delete cache folders
rmdir /s /q .expo
rmdir /s /q node_modules\.cache

REM Restart
npm start
```

**Windows (PowerShell):**
```powershell
# Stop the server (Ctrl+C)

# Delete cache folders
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Restart
npm start
```

**Mac/Linux:**
```bash
# Stop the server (Ctrl+C)

# Delete cache folders
rm -rf .expo
rm -rf node_modules/.cache

# Restart
npm start
```

### Option 2: Delete and Reinstall App
1. Delete the app from your device/simulator
2. Stop the dev server
3. Run: `npm run start:clear`
4. Reinstall the app by scanning QR code again

### Option 3: Check for Multiple .env Files
```bash
# Make sure there's only one .env file
find . -name ".env*" -type f
```

Should only show: `./.env`

If you see `.env.local` or `.env.production`, they might be overriding your settings.

## Need to Change Projects?

If you want to connect to a **different** Supabase project:

1. Open `mobileapp/.env`
2. Update the URL and Key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```
3. Run: `npm run start:clear`
4. Reload the app

## Get Your Supabase Credentials

If you need to find your correct Supabase credentials:

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "Settings" → "API"
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

**TL;DR**: Run `npm run start:clear` and reload the app. That fixes it 99% of the time! 🎉
