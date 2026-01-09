# Installation Guide - Quick Start

## 🚀 Fastest Options (Try These First)

### Option 1: Tunnel Mode (Bypasses Network Issues)
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm run start:tunnel
```
Then scan QR code with Expo Go app.

### Option 2: Web Version (For Quick Testing)
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm run web
```
Opens in browser - good for quick UI testing.

---

## 📱 Install on Device (Recommended)

### Method A: Build Standalone APK (Android)

**Step 1: Install EAS CLI**
```powershell
npm install -g eas-cli
```

**Step 2: Login to Expo**
```powershell
eas login
```
(Create free account at https://expo.dev if needed)

**Step 3: Build APK**
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm run build:apk
```

**Step 4: Download and Install**
- Wait for build to complete (10-20 minutes)
- Download APK from the link provided
- Transfer to your Android device
- Install APK (enable "Install from unknown sources" if needed)

**Pros:** Works completely offline, no Metro needed
**Cons:** Need to rebuild for each code change

---

### Method B: Development Build (Best for Development)

**Step 1-2: Same as above (Install EAS, Login)**

**Step 3: Build Development Client**
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm run build:dev:android
```

**Step 4: Install on Device**
- Download and install the development client APK
- This is a one-time install

**Step 5: Start Development Server**
```powershell
npm start
```

**Step 6: Connect**
- Open the development client app on your phone
- It will automatically connect to Metro
- Shake device → "Configure Bundle" → Enter your computer's IP:8081

**Pros:** 
- More stable than Expo Go
- Can use custom native modules
- Hot reload works
- Only need to rebuild when adding native dependencies

**Cons:** 
- First build takes 15-20 minutes
- Need EAS account (free)

---

## 🔧 Alternative: Local Build (Advanced)

If you have Android Studio installed:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp

# Generate native Android project
npm run prebuild

# Build APK locally
cd android
.\gradlew assembleDebug
```

APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📋 Quick Comparison

| Method | Time to First Run | Update Speed | Best For |
|--------|------------------|--------------|----------|
| **Tunnel Mode** | Instant | Instant | Quick testing |
| **Web Version** | Instant | Instant | UI testing |
| **Dev Build** | 15-20 min | Fast | Development |
| **Standalone APK** | 20 min | Slow | Testing/Demo |
| **Local Build** | 30+ min | Fast | Full control |

---

## 🎯 Recommended Workflow

1. **For Quick Testing:** Use tunnel mode or web version
2. **For Development:** Build development client (one time), then use `npm start`
3. **For Distribution:** Build standalone APK

---

## ⚡ Quick Commands Reference

```powershell
# Start with tunnel (bypasses network issues)
npm run start:tunnel

# Start with cleared cache
npm run start:clear

# Build development client for Android
npm run build:dev:android

# Build standalone APK
npm run build:apk

# Run web version
npm run web
```

---

## 🆘 Troubleshooting

### EAS Build Fails:
- Check you're logged in: `eas whoami`
- Verify app.json is valid
- Check build logs: `eas build:list`

### Development Client Won't Connect:
- Ensure phone and computer on same network
- Check firewall allows port 8081
- Try tunnel mode: `npm run start:tunnel`

### APK Won't Install:
- Enable "Install from unknown sources" in Android settings
- Check APK is for correct architecture (arm64-v8a, armeabi-v7a, etc.)

---

## 📞 Need Help?

See `ALTERNATIVE_INSTALL.md` for detailed explanations of each method.
