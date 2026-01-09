# Quick Start - Choose Your Method

## 🎯 Option 1: Use Expo Go (Easiest - Recommended)

**Step 1: Install Expo Go on your phone**
- Android: [Download from Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)

**Step 2: Start the server**
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm start
```

**Step 3: Connect**
- Scan QR code with Expo Go app (Android) or Camera (iOS)
- Or press `a` for Android emulator, `i` for iOS simulator

**Note:** If you get connection errors, try:
```powershell
npm run start:tunnel
```

---

## 🔧 Option 2: Build Development Build (For Custom Native Modules)

If you need custom native modules or more stability:

**Step 1: Install EAS CLI**
```powershell
npm install -g eas-cli
```

**Step 2: Login**
```powershell
eas login
```
(Create free account at https://expo.dev if needed)

**Step 3: Build development client**
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm run build:dev:android
```

**Step 4: Install on device**
- Wait for build (15-20 minutes)
- Download APK from the link
- Install on your Android device

**Step 5: Start development server**
```powershell
npm start
```

**Step 6: Connect**
- Open the development client app on your phone
- It will auto-connect to Metro
- If not, shake device → "Configure Bundle" → Enter your IP:8081

---

## 📦 Option 3: Build Standalone APK (Works Offline)

**Step 1-2: Same as above (Install EAS, Login)**

**Step 3: Build APK**
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm run build:apk
```

**Step 4: Install**
- Download APK (takes 15-20 minutes to build)
- Transfer to device and install
- Works completely offline - no Metro needed!

---

## ⚠️ Current Error Explanation

You're seeing: "No development build (com.pos.admin) for this project is installed"

This means:
- You're trying to use a development build
- But it's not installed on your device yet
- You need to either:
  1. **Use Expo Go instead** (easiest - just install Expo Go app)
  2. **Build and install a development client** (follow Option 2 above)
  3. **Build a standalone APK** (follow Option 3 above)

---

## 🚀 Recommended: Start with Expo Go

Since you have `expo-dev-client` installed, you might want to remove it temporarily to use Expo Go:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm uninstall expo-dev-client
npm start
```

Then scan QR code with Expo Go app.

**Or keep it and build a development client** - your choice!

---

## 📋 Quick Commands

```powershell
# Start with Expo Go (if no dev client)
npm start

# Start with tunnel (bypasses network)
npm run start:tunnel

# Build development client
npm run build:dev:android

# Build standalone APK
npm run build:apk

# Run web version
npm run web
```

---

## ❓ Which Should I Choose?

- **Just testing quickly?** → Use Expo Go
- **Developing with custom modules?** → Build development client
- **Need to distribute/test offline?** → Build standalone APK
- **Network issues?** → Use tunnel mode or standalone APK
