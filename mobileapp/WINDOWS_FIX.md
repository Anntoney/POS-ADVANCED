# 🪟 Windows Quick Fix Guide

## Problem: App connecting to wrong Supabase project

## ✅ Easiest Solution (Recommended)

Just double-click this file:
```
clear-cache.bat
```

It will automatically clear the cache and restart Expo!

## 📝 Manual Steps

### Option 1: Using the Batch Script
1. Open File Explorer
2. Navigate to `D:\POS\POS-ADVANCED\mobileapp`
3. Double-click `clear-cache.bat`
4. Wait for Expo to start
5. Reload your app

### Option 2: Using Command Prompt
```cmd
cd D:\POS\POS-ADVANCED\mobileapp
npx expo start --clear
```

### Option 3: Using PowerShell
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
.\clear-cache.ps1
```

Or:
```powershell
npx expo start --clear
```

### Option 4: Manual Delete (If scripts don't work)
1. Open File Explorer
2. Go to `D:\POS\POS-ADVANCED\mobileapp`
3. Delete the `.expo` folder (if it exists)
4. Go into `node_modules` folder
5. Delete the `.cache` folder inside (if it exists)
6. Open Command Prompt in this folder
7. Run: `npx expo start`

## 🔍 Verify It's Fixed

After restarting, look at the terminal output. You should see:
```
🔧 Supabase Configuration:
URL: https://soqxolezaulotushohjd.supabase.co
Project Ref: soqxolezaulotushohjd
```

Make sure the **Project Ref** matches: `soqxolezaulotushohjd`

## 📱 Reload the App

After Expo restarts:

**On Physical Device:**
- Shake your phone
- Tap "Reload"

**On Android Emulator:**
- Press `RR` in the terminal (double R)
- Or press `Ctrl+M` in emulator, then tap "Reload"

**On iOS Simulator:**
- Press `R` in the terminal
- Or press `Cmd+R` in simulator

## ⚠️ PowerShell Script Issues?

If you get an error like "cannot be loaded because running scripts is disabled":

**Fix:**
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Type `Y` and press Enter
4. Try running the script again

Or just use the `.bat` file instead!

## 🎯 Quick Commands Reference

| Task | Command |
|------|---------|
| Clear cache & start | `npx expo start --clear` |
| Just start | `npx expo start` |
| Start on Android | `npx expo start --android` |
| Start on iOS | `npx expo start --ios` |
| Check environment | `npm run check-env` |

## 🆘 Still Not Working?

### Complete Reset:
```cmd
cd D:\POS\POS-ADVANCED\mobileapp

REM Delete cache folders
rmdir /s /q .expo
rmdir /s /q node_modules\.cache

REM Reinstall dependencies (if needed)
REM npm install

REM Start fresh
npx expo start --clear
```

### Delete and Reinstall App:
1. Delete the app from your phone/emulator
2. Stop Expo (Ctrl+C)
3. Run: `npx expo start --clear`
4. Scan QR code again to reinstall

## 📞 Need Different Supabase Project?

1. Open `mobileapp\.env` in Notepad
2. Change the URL and Key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```
3. Save the file
4. Run: `clear-cache.bat` or `npx expo start --clear`
5. Reload the app

---

**TL;DR**: Double-click `clear-cache.bat` and reload your app! 🚀
