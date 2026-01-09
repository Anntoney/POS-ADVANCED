# Troubleshooting Guide

## Common Issues and Solutions

### 1. "main has not been registered" Error

**Symptoms:**
- App crashes on startup
- Error: `Invariant Violation: "main" has not been registered`

**Solutions:**

1. **Stop and restart Metro bundler:**
   ```bash
   # Stop the current Metro server (Ctrl+C)
   # Then restart:
   cd mobileapp
   npm start -- --reset-cache
   ```

2. **Clear Expo cache:**
   ```bash
   cd mobileapp
   expo start -c
   ```

3. **Reinstall dependencies:**
   ```bash
   cd mobileapp
   rm -rf node_modules
   npm install
   npm start
   ```

4. **Ensure you're running from the correct directory:**
   - Make sure you're in the `mobileapp` directory when running `npm start`
   - The Metro bundler should show paths starting with `mobileapp/`

### 2. Security Exception: DETECT_SCREEN_CAPTURE

**Symptoms:**
- Warning about `android.permission.DETECT_SCREEN_CAPTURE`
- This is a non-critical warning from Expo

**Solution:**
- This warning can be safely ignored
- It's related to Expo's development tools trying to detect screen capture
- It won't affect app functionality

### 3. Missing Supabase Environment Variables

**Symptoms:**
- Warning: "Missing Supabase environment variables"
- App can't connect to Supabase

**Solution:**
1. Create a `.env` file in the `mobileapp` directory
2. Add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```
3. Restart the Expo server

### 4. "Access Denied" on Login

**Symptoms:**
- Login succeeds but immediately logs out
- Error: "Access Denied - This app is for administrators only"

**Solution:**
- Ensure the user has `role: 'admin'` in the `profiles` table
- Check the user exists in Supabase Auth
- Verify RLS policies allow the user to read their profile

### 5. Module Not Found Errors

**Symptoms:**
- Errors about missing modules or packages

**Solution:**
```bash
cd mobileapp
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### 6. TypeScript Errors

**Symptoms:**
- Type errors in the IDE or during build

**Solution:**
1. Ensure all dependencies are installed
2. Restart your TypeScript server in your IDE
3. Check that `tsconfig.json` is properly configured

### 7. App Won't Load on Device

**Symptoms:**
- QR code doesn't work
- App doesn't appear in Expo Go

**Solutions:**
1. **Check network connection:**
   - Ensure phone and computer are on the same network
   - Try using tunnel mode: `expo start --tunnel`

2. **Check Expo Go version:**
   - Update Expo Go to the latest version
   - Ensure it's compatible with Expo SDK 50

3. **Try different connection method:**
   ```bash
   # Use tunnel (slower but more reliable)
   expo start --tunnel
   
   # Or use LAN
   expo start --lan
   ```

### 8. Navigation Errors

**Symptoms:**
- "Cannot read property 'replace' of undefined"
- Navigation not working

**Solution:**
- Ensure you're using `useRouter()` from `expo-router` inside a component that's part of the router tree
- Don't use router hooks in the root `_layout.tsx` before the router is initialized

## Still Having Issues?

1. **Check Expo and React Native versions:**
   ```bash
   npx expo --version
   node --version
   ```

2. **Check for known issues:**
   - [Expo GitHub Issues](https://github.com/expo/expo/issues)
   - [Expo Forums](https://forums.expo.dev/)

3. **Create a fresh Expo project to test:**
   ```bash
   npx create-expo-app test-app
   cd test-app
   npm start
   ```
   If this works, the issue is likely with the project configuration.

4. **Check logs:**
   - Check Metro bundler output for detailed error messages
   - Check device logs in Expo Go (shake device → "Show Dev Menu" → "Debug Remote JS")

## Getting Help

When asking for help, provide:
- Expo version: `npx expo --version`
- Node version: `node --version`
- Full error message from Metro bundler
- Steps to reproduce the issue
- What you've already tried
