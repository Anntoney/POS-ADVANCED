# Fix Environment Variable Issue

## Problem
The app is connecting to a different Supabase project instead of the one specified in `.env` file.

## Root Cause
Expo caches environment variables and doesn't automatically reload them when changed.

## Solution

### Step 1: Stop the Development Server
Press `Ctrl+C` in the terminal where `npm start` is running.

### Step 2: Clear Expo Cache
Run one of these commands:

**Option A (Recommended):**
```bash
npx expo start --clear
```

**Option B:**
```bash
npm start -- --clear
```

**Option C (Nuclear option):**

**Windows (Command Prompt):**
```cmd
rmdir /s /q .expo
rmdir /s /q node_modules\.cache
npx expo start
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
npx expo start
```

**Mac/Linux:**
```bash
rm -rf .expo
rm -rf node_modules/.cache
npx expo start
```

### Step 3: Verify Environment Variables

Add this temporary debug code to check what values are being loaded:

**File: `mobileapp/lib/supabase.ts`**

Add these console logs at the top:
```typescript
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

### Step 4: Restart the App
```bash
npm start
```

Then reload the app on your device (shake device and tap "Reload").

## Alternative: Use app.config.js Instead

If the issue persists, create an `app.config.js` file instead of using `.env`:

**File: `mobileapp/app.config.js`**
```javascript
export default {
  expo: {
    name: "Admin Mobile App",
    slug: "admin-mobile-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.adminapp"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.yourcompany.adminapp"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      supabaseUrl: "https://soqxolezaulotushohjd.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcXhvbGV6YXVsb3R1c2hvaGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzQ1MzMsImV4cCI6MjA4NTgxMDUzM30.MYPA-5QyUxdgfwMYJiJwN23CNMe1SU5hEWYu4kZUZuU"
    }
  }
}
```

Then update `lib/supabase.ts`:
```typescript
import Constants from 'expo-constants'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey
```

## Verification Checklist

After clearing cache and restarting:

1. [ ] Check terminal logs for correct Supabase URL
2. [ ] Try logging in with admin credentials
3. [ ] Verify data matches your correct project
4. [ ] Check that products/sales are from the right database

## Common Issues

### Issue: Still connecting to wrong project
**Solution**: 
- Delete the app from your device/simulator
- Clear all caches
- Reinstall the app

### Issue: Environment variables are undefined
**Solution**:
- Ensure `.env` file is in the root of `mobileapp/` folder
- Variable names must start with `EXPO_PUBLIC_`
- Restart Metro bundler with `--clear` flag

### Issue: Works on one platform but not another
**Solution**:
- Clear cache for that specific platform
- iOS: `npx expo start --clear --ios`
- Android: `npx expo start --clear --android`

## Quick Test

Run this in your terminal to verify the .env file is correct:
```bash
cat mobileapp/.env
```

Should show:
```
EXPO_PUBLIC_SUPABASE_URL=https://soqxolezaulotushohjd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Need to Change Supabase Project?

If you need to connect to a different project:

1. Update `.env` file with new credentials
2. Stop the server
3. Clear cache: `npx expo start --clear`
4. Restart and reload app

---

**Most Common Fix**: Just run `npx expo start --clear` and reload the app!
