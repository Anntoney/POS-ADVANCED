# Quick Fix for "main has not been registered" Error

## The Problem
This error occurs when Metro bundler can't find or load the app entry point. This is usually because:
1. Metro is running from the wrong directory
2. Cache is corrupted
3. A module is failing to load

## Step-by-Step Fix

### 1. Stop Everything
- Press `Ctrl+C` in ALL terminal windows running Metro/Expo
- Close and reopen your terminal

### 2. Navigate to Correct Directory
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
```

### 3. Verify You're in the Right Place
```powershell
dir app
```
You should see `_layout.tsx`, `index.tsx`, and folders like `(tabs)` and `auth`

### 4. Clear ALL Caches
```powershell
# Remove Expo cache
if (Test-Path .expo) { Remove-Item -Recurse -Force .expo }

# Remove Metro cache
if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }

# Remove watchman cache (if installed)
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all
}
```

### 5. Reinstall Dependencies (if needed)
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### 6. Start Fresh
```powershell
# Use cmd to bypass PowerShell execution policy
cmd /c "npm start -- --reset-cache"
```

### 7. Alternative: Use npx expo directly
```powershell
npx expo start --clear
```

## Verify Metro is Running from Correct Directory

When Metro starts, check the output. It should show:
```
Metro waiting on exp://192.168.x.x:8081
```

And file paths in errors should start with `mobileapp/` not `POS-ADVANCED/`

## If Still Not Working

1. **Check package.json main entry:**
   ```json
   "main": "expo-router/entry"
   ```
   This should be exactly as shown.

2. **Verify app.json has expo-router plugin:**
   ```json
   "plugins": ["expo-router"]
   ```

3. **Check for syntax errors:**
   ```powershell
   npx tsc --noEmit
   ```

4. **Try creating a minimal test:**
   Temporarily rename `app/index.tsx` to `app/index.tsx.backup` and create a simple version:
   ```tsx
   import { View, Text } from 'react-native';
   export default function Index() {
     return <View><Text>Test</Text></View>;
   }
   ```

5. **Check Expo version compatibility:**
   ```powershell
   npx expo --version
   ```
   Should be compatible with SDK 50.

## Still Having Issues?

The error might be caused by:
- Supabase initialization failing silently
- Path alias `@/` not resolving
- Missing dependencies

Try the lazy-loading version I just created, which loads Supabase asynchronously to avoid blocking app initialization.
