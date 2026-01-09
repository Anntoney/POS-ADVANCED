# Fix: Cannot find native module 'ExpoLinking'

## The Problem
The app is missing the `expo-linking` native module, which is required by `expo-router`.

## Solution

### Step 1: Install Missing Dependencies

Stop Metro (Ctrl+C) and run:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm install expo-linking
```

### Step 2: Clear Cache and Restart

```powershell
# Clear caches
if (Test-Path .expo) { Remove-Item -Recurse -Force .expo }
if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }

# Restart Metro
npm start
```

### Step 3: If Using Expo Go

After installing, press `s` in Metro to switch to Expo Go mode, then scan QR code.

### Step 4: If Using Development Build

If you're using a development build, you'll need to rebuild it after adding native modules:

```powershell
npm run build:dev:android
```

Then install the new APK on your device.

---

## Why This Happens

- `expo-router` depends on `expo-linking` for deep linking
- It was installed as a transitive dependency but not directly
- Native modules need to be explicitly listed in package.json for proper linking

---

## After Installing

1. Restart Metro with cleared cache
2. Press `s` to switch to Expo Go (if needed)
3. Scan QR code
4. App should load successfully!
