# How to Generate APK - Complete Guide

## 📱 Two Methods to Build APK

### Method 1: EAS Build (Recommended - Easiest)
### Method 2: Local Build (Advanced)

---

## 🚀 Method 1: EAS Build (Recommended)

This is the easiest and most reliable method. Expo's cloud service builds the APK for you.

### Step 1: Install EAS CLI

```cmd
npm install -g eas-cli
```

### Step 2: Login to Expo

```cmd
eas login
```

If you don't have an Expo account:
1. Go to https://expo.dev
2. Sign up for free
3. Then run `eas login` and enter your credentials

### Step 3: Configure Your Project

```cmd
cd mobileapp
eas build:configure
```

This will create an `eas.json` file. Press Enter to accept defaults.

### Step 4: Update app.json

Make sure your `app.json` has a unique package name:

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.adminapp"
    }
  }
}
```

Change `com.yourcompany.adminapp` to something unique like:
- `com.yourstore.adminapp`
- `com.yourbusiness.posadmin`

### Step 5: Build APK

```cmd
eas build --platform android --profile preview
```

**What happens:**
1. Code is uploaded to Expo servers
2. APK is built in the cloud (takes 10-20 minutes)
3. You get a download link

### Step 6: Download APK

When build completes, you'll see:
```
✔ Build finished
https://expo.dev/artifacts/eas/xxxxx.apk
```

Click the link or run:
```cmd
eas build:list
```

Then download the APK from the link.

### Step 7: Install APK

**On your phone:**
1. Download the APK file
2. Open it
3. Allow "Install from unknown sources" if prompted
4. Install the app

---

## 🔧 Method 2: Local Build (Advanced)

This builds the APK on your computer. Requires more setup.

### Prerequisites

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install with default settings
   - Open Android Studio once to complete setup

2. **Install Java JDK**
   - Download JDK 17: https://www.oracle.com/java/technologies/downloads/
   - Install and set JAVA_HOME environment variable

3. **Set Environment Variables**

   **Windows:**
   ```cmd
   setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
   setx PATH "%PATH%;%LOCALAPPDATA%\Android\Sdk\platform-tools"
   ```

### Build Steps

1. **Install Expo CLI**
   ```cmd
   npm install -g expo-cli
   ```

2. **Prebuild**
   ```cmd
   cd mobileapp
   npx expo prebuild --platform android
   ```

3. **Build APK**
   ```cmd
   cd android
   gradlew assembleRelease
   ```

4. **Find APK**
   APK will be at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

---

## 📦 Build Profiles (EAS)

You can create different build types in `eas.json`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

**Build types:**
- `apk` - For direct installation (testing)
- `app-bundle` - For Google Play Store (production)

---

## 🎯 Quick Commands Reference

### EAS Build (Recommended)

```cmd
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
cd mobileapp
eas build:configure

# Build APK
eas build --platform android --profile preview

# Check build status
eas build:list

# Download latest build
eas build:download --platform android
```

### Local Build

```cmd
# Prebuild
npx expo prebuild --platform android

# Build
cd android
gradlew assembleRelease

# APK location
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔐 Signing Your APK (For Production)

### Generate Keystore

```cmd
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Save these details:**
- Keystore password
- Key alias
- Key password

### Configure in eas.json

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "local"
      }
    }
  }
}
```

---

## 📱 Testing Your APK

### Before Building:
1. ✅ Test app thoroughly in Expo Go
2. ✅ Test dark mode
3. ✅ Test all features
4. ✅ Check currency displays correctly
5. ✅ Test on different screen sizes

### After Building:
1. Install APK on test device
2. Test without Expo Go
3. Check app icon appears
4. Test all features again
5. Check performance

---

## 🐛 Common Issues

### Issue: "eas: command not found"
**Fix:**
```cmd
npm install -g eas-cli
```

### Issue: "Not logged in"
**Fix:**
```cmd
eas login
```

### Issue: "Build failed - Invalid package name"
**Fix:** Update `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.uniquename"
    }
  }
}
```

### Issue: "Gradle build failed"
**Fix:**
```cmd
cd android
gradlew clean
gradlew assembleRelease
```

### Issue: APK won't install
**Fix:**
1. Enable "Install from unknown sources" in phone settings
2. Make sure you're not installing over a different signature

---

## 📊 Build Size Optimization

To reduce APK size:

1. **Enable Hermes** (already enabled in Expo SDK 54)

2. **Remove unused assets**
   ```cmd
   # Remove large images you don't need
   ```

3. **Use APK Analyzer**
   - Open APK in Android Studio
   - Analyze → Analyze APK
   - See what's taking space

---

## 🚀 Publishing to Google Play Store

### Step 1: Build AAB (App Bundle)

```cmd
eas build --platform android --profile production
```

### Step 2: Create Google Play Console Account
- Go to: https://play.google.com/console
- Pay $25 one-time fee
- Create developer account

### Step 3: Create App
1. Click "Create app"
2. Fill in app details
3. Upload screenshots
4. Write description

### Step 4: Upload AAB
1. Go to "Production" → "Create new release"
2. Upload your .aab file
3. Fill in release notes
4. Submit for review

### Step 5: Wait for Review
- Usually takes 1-3 days
- You'll get email when approved

---

## 📝 Checklist Before Building

- [ ] App tested thoroughly in Expo Go
- [ ] All features working
- [ ] Dark mode working
- [ ] Currency displaying correctly
- [ ] No console errors
- [ ] Updated version in app.json
- [ ] Unique package name set
- [ ] App icon added (optional but recommended)
- [ ] Splash screen added (optional)

---

## 🎨 Optional: Add App Icon

Before building, add your app icon:

1. Create 1024x1024 PNG icon
2. Save as `mobileapp/assets/icon.png`
3. Update `app.json`:
   ```json
   {
     "expo": {
       "icon": "./assets/icon.png"
     }
   }
   ```

---

## 💡 Tips

1. **Use EAS Build** - Much easier than local builds
2. **Test in Expo Go first** - Catch bugs early
3. **Keep keystore safe** - You'll need it for updates
4. **Version your builds** - Increment version in app.json
5. **Test on real device** - Emulators don't catch everything

---

## 🆘 Need Help?

- Expo Docs: https://docs.expo.dev/build/setup/
- EAS Build: https://docs.expo.dev/build/introduction/
- Android Studio: https://developer.android.com/studio

---

## ⚡ Quick Start (TL;DR)

**Fastest way to get APK:**

```cmd
# Install EAS
npm install -g eas-cli

# Login
eas login

# Go to project
cd mobileapp

# Configure
eas build:configure

# Build
eas build --platform android --profile preview

# Wait 10-20 minutes, download APK from link
```

**Done!** 🎉

---

**Recommended:** Use EAS Build (Method 1) - it's free, easy, and reliable!
