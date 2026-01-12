# Fixing "Network request failed" Error

## Problem
The app shows `TypeError: Network request failed` when trying to fetch currency data from Supabase.

## Solutions Applied

### 1. Enhanced Error Handling ✅
- Added detailed error logging in `CurrencyContext.tsx`
- Added checks for missing Supabase configuration
- Improved error messages to help diagnose issues

### 2. Network Security Configuration ✅
- Created `network_security_config.xml` for Android
- Updated `AndroidManifest.xml` to use the network security config
- Ensures HTTPS connections work properly on Android 9+

### 3. Supabase Client Configuration ✅
- Enhanced Supabase client with better headers and configuration
- Added proper content-type headers

## Additional Troubleshooting Steps

### Step 1: Verify Environment Variables
Make sure you have a `.env` file in the `mobileapp` directory with:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** 
- Replace `your-project.supabase.co` with your actual Supabase project URL
- Replace `your-anon-key-here` with your actual Supabase anon key
- The URL must start with `https://` (not `http://`)
- Do NOT use `localhost` or `127.0.0.1` - these won't work on Android devices

### Step 2: Restart Expo Server
After updating `.env` file:

```bash
cd mobileapp
# Stop the current server (Ctrl+C)
npm start -- --clear
```

### Step 3: Check Network Connection
- Ensure your Android device/emulator has internet access
- If using an emulator, make sure it can reach the internet
- Try opening a browser on the device and visiting your Supabase URL

### Step 4: Verify Supabase Project
1. Go to your Supabase dashboard
2. Check that your project is active and running
3. Verify the URL matches what's in your `.env` file
4. Check that the `currencies` table exists and has data

### Step 5: Check Android Logs
View detailed error logs:

```bash
# If using Expo Go
# Shake device → "Show Dev Menu" → "Debug Remote JS"

# If using development build
adb logcat | grep -i "currency\|supabase\|network"
```

### Step 6: Test Supabase Connection
You can test if Supabase is reachable by checking the logs. The enhanced error handling will now show:
- Whether Supabase URL is configured
- Detailed error messages
- Network-specific error detection

## Common Issues

### Issue: "Missing Supabase environment variables"
**Solution:** Create/update `.env` file and restart Expo server

### Issue: "Network request failed" persists
**Possible causes:**
1. **Wrong Supabase URL** - Check that it's the correct project URL
2. **No internet connection** - Verify device has internet
3. **Firewall blocking** - Check if firewall is blocking connections
4. **Supabase project paused** - Check Supabase dashboard

### Issue: Works on iOS but not Android
**Solution:** The network security config should fix this. Rebuild the app:
```bash
cd mobileapp
npx expo prebuild --clean
npx expo run:android
```

## Testing the Fix

After applying these fixes:

1. **Check the console logs** - You should see more detailed error messages
2. **Verify Supabase connection** - Look for "✅ Currency loaded successfully" in logs
3. **Test on device** - The app should now handle network errors gracefully and fall back to USD

## Still Having Issues?

1. Check the enhanced error logs in the console
2. Verify your Supabase project is accessible from a browser
3. Try using tunnel mode: `expo start --tunnel`
4. Check if other Supabase queries work (like login)
