# Alternative Installation Methods

Since you're having issues with Metro bundler, here are several alternative ways to install and run the app:

## Option 1: Development Build (Recommended)

This creates a custom development client that you install on your device, then connect to Metro.

### Setup:
```powershell
cd D:\POS\POS-ADVANCED\mobileapp

# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build development client for Android
eas build --profile development --platform android

# Or for iOS
eas build --profile development --platform ios
```

**Pros:**
- More stable than Expo Go
- Can use custom native modules
- Better for development

**Cons:**
- Requires EAS account (free tier available)
- First build takes 10-20 minutes
- Need to rebuild when native dependencies change

---

## Option 2: Build Standalone APK (Android)

Build a standalone APK you can install directly on your Android device.

### Using EAS Build:
```powershell
cd D:\POS\POS-ADVANCED\mobileapp

# Install EAS CLI if not already installed
npm install -g eas-cli

# Login
eas login

# Build APK
eas build --profile preview --platform android
```

After build completes, download the APK and install it on your device.

### Using Local Build (Requires Android Studio):
```powershell
# Generate native Android project
npx expo prebuild --platform android

# Build APK locally (requires Android Studio setup)
cd android
.\gradlew assembleDebug
```

The APK will be in `android/app/build/outputs/apk/debug/app-debug.apk`

**Pros:**
- No Metro bundler needed
- Works offline after installation
- Can distribute to testers

**Cons:**
- Need to rebuild for each change
- Larger file size
- Requires EAS account or Android Studio setup

---

## Option 3: Use Expo Go (Simplest)

If you haven't tried this yet, Expo Go is the simplest option:

### Steps:
1. **Install Expo Go on your phone:**
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Start the server (from mobileapp directory):**
   ```powershell
   cd D:\POS\POS-ADVANCED\mobileapp
   npx expo start
   ```

3. **Connect:**
   - Scan QR code with Expo Go app (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

**Pros:**
- No build needed
- Instant updates
- Easiest to use

**Cons:**
- Limited to Expo SDK modules
- Can have connection issues
- What you're experiencing now

---

## Option 4: Use Tunnel Mode

If network is the issue, try tunnel mode:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npx expo start --tunnel
```

This uses ngrok to create a tunnel, bypassing local network issues.

---

## Option 5: Build with React Native CLI

Convert to pure React Native (more complex):

```powershell
cd D:\POS\POS-ADVANCED\mobileapp

# Eject from Expo (creates native folders)
npx expo prebuild

# Install React Native CLI
npm install -g react-native-cli

# Run on Android
npx react-native run-android

# Or iOS
npx react-native run-ios
```

**Pros:**
- Full control
- No Expo limitations
- Standard React Native workflow

**Cons:**
- More complex setup
- Need Android Studio / Xcode
- Loses some Expo benefits

---

## Option 6: Use Web Version

Run as a web app (for testing):

```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npx expo start --web
```

Opens in browser. Limited mobile features but good for quick testing.

---

## Recommended Approach

For your situation, I recommend:

1. **First, try tunnel mode:**
   ```powershell
   cd D:\POS\POS-ADVANCED\mobileapp
   npx expo start --tunnel
   ```

2. **If that doesn't work, build a development client:**
   ```powershell
   npm install -g eas-cli
   eas login
   eas build --profile development --platform android
   ```

3. **For production/testing, build APK:**
   ```powershell
   eas build --profile preview --platform android
   ```

---

## Quick Comparison

| Method | Setup Time | Update Speed | Stability | Best For |
|--------|-----------|--------------|-----------|----------|
| Expo Go | Instant | Instant | Medium | Quick testing |
| Tunnel Mode | Instant | Instant | Medium | Network issues |
| Dev Build | 15 min | Fast | High | Development |
| Standalone APK | 20 min | Slow | High | Testing/Distribution |
| React Native CLI | 30 min | Fast | High | Full control |

---

## Troubleshooting Each Method

### EAS Build Issues:
- Make sure you're logged in: `eas whoami`
- Check build status: `eas build:list`
- View logs: `eas build:view [BUILD_ID]`

### Local Build Issues:
- Install Android Studio and SDK
- Set ANDROID_HOME environment variable
- Accept Android licenses: `sdkmanager --licenses`

### Expo Go Connection Issues:
- Ensure phone and computer on same network
- Try tunnel mode: `expo start --tunnel`
- Check firewall settings

---

## Next Steps

1. Try tunnel mode first (easiest)
2. If that works, you're good to go!
3. If not, set up EAS and build a development client
4. For production, build standalone APK

Let me know which method you'd like to try!
