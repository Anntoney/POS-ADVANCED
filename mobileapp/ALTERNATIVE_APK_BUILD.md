# Alternative Ways to Generate APK

If EAS Build is causing issues, here are several alternative methods to generate an APK:

## Method 1: Local Build with Expo Prebuild (Recommended Alternative)

Build the APK locally on your computer using Android Studio.

### Prerequisites:
- [Android Studio](https://developer.android.com/studio) installed
- [JDK 17](https://adoptium.net/) or higher installed
- Android SDK installed (comes with Android Studio)

### Steps:

1. **Generate native Android project:**
```bash
cd mobileapp
npx expo prebuild --platform android
```

This creates an `android/` folder with the native project.

2. **Open in Android Studio:**
```bash
# Open Android Studio
# File → Open → Select the 'android' folder in your mobileapp directory
```

3. **Build APK in Android Studio:**
   - In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Or use terminal in Android Studio: **Build → Generate Signed Bundle / APK**

4. **Or build from command line:**
```bash
cd mobileapp/android
# Windows:
.\gradlew assembleRelease

# Mac/Linux:
./gradlew assembleRelease
```

**APK Location:** `android/app/build/outputs/apk/release/app-release.apk`

### Pros:
- ✅ No EAS account needed
- ✅ Free (uses your own machine)
- ✅ Full control over build process
- ✅ Can debug build issues locally
- ✅ Faster iterations (no upload/download time)

### Cons:
- ❌ Requires Android Studio setup (large download ~1GB)
- ❌ More complex setup
- ❌ Requires Android SDK and JDK installation
- ❌ Platform-specific (Windows/Mac/Linux)

---

## Method 2: Use Expo Development Build (Then Build Locally)

Build a development APK which is easier than release builds.

### Steps:

1. **Generate native project:**
```bash
cd mobileapp
npx expo prebuild --platform android
```

2. **Build debug APK:**
```bash
cd android
.\gradlew assembleDebug
```

**APK Location:** `android/app/build/outputs/apk/debug/app-debug.apk`

**Note:** Debug APKs are larger and include development tools, but easier to build.

---

## Method 3: Use GitHub Actions (Free CI/CD)

Automate builds using GitHub Actions (completely free for public repos).

### Setup:

1. **Create `.github/workflows/build-apk.yml`:**

```yaml
name: Build Android APK

on:
  workflow_dispatch:  # Manual trigger
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Install dependencies
        run: |
          cd mobileapp
          npm install
      
      - name: Generate Android project
        run: |
          cd mobileapp
          npx expo prebuild --platform android
      
      - name: Build APK
        run: |
          cd mobileapp/android
          chmod +x gradlew
          ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: mobileapp/android/app/build/outputs/apk/release/app-release.apk
```

2. **Push to GitHub and trigger workflow**
3. **Download APK from GitHub Actions artifacts**

### Pros:
- ✅ Completely free (public repos)
- ✅ Automated builds
- ✅ No local setup needed
- ✅ Can trigger from anywhere

### Cons:
- ❌ Requires GitHub repository
- ❌ More setup complexity
- ❌ Builds happen in cloud (can be slower)

---

## Method 4: Use Local Build Service (Titanium, Capacitor)

Convert your Expo app to use a different build system.

### Option A: Use Capacitor (Not Recommended for Expo Router)

This requires significant changes to your app structure.

### Option B: Use React Native CLI Directly

Eject from Expo and use React Native CLI (not recommended as you'll lose Expo features).

---

## Method 5: Use Alternative Cloud Build Services

### Option A: Bitrise (Free tier available)
- Similar to EAS Build
- Free tier: 200 build minutes/month
- Setup: Connect GitHub repo

### Option B: CircleCI (Free tier available)
- Free tier: 6,000 build minutes/month
- More complex setup but very flexible

### Option C: AppCircle (Free tier available)
- Free tier available
- Focused on mobile app builds

---

## Method 6: Use Expo Classic Build (Deprecated but still works)

If you have an older Expo account, you might be able to use the classic build service, but this is deprecated.

---

## 🎯 Recommended Approach

**For your situation, I recommend Method 1 (Local Build):**

1. **Install Android Studio** (if not already installed)
2. **Install JDK 17+**
3. **Generate native project:**
   ```bash
   cd mobileapp
   npx expo prebuild --platform android
   ```
4. **Build APK:**
   ```bash
   cd android
   .\gradlew assembleRelease
   ```

This gives you:
- ✅ Full control
- ✅ No EAS account needed
- ✅ Can debug issues directly
- ✅ Faster build cycles

---

## 📋 Quick Start: Local Build Setup

### Step 1: Install Prerequisites

1. **Download Android Studio:**
   - Visit: https://developer.android.com/studio
   - Download and install (~1GB)

2. **Install JDK 17:**
   - Visit: https://adoptium.net/
   - Download JDK 17 for Windows
   - Install and set JAVA_HOME environment variable

3. **Configure Android SDK:**
   - Open Android Studio
   - Go to **Tools → SDK Manager**
   - Install Android SDK (API level 33 or 34)
   - Install Build Tools

### Step 2: Generate Native Project

```bash
cd D:\POS\POS-ADVANCED\mobileapp
npx expo prebuild --platform android
```

### Step 3: Build APK

**Option A - Using Android Studio:**
1. Open Android Studio
2. **File → Open** → Select `mobileapp/android` folder
3. Wait for Gradle sync to complete
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. APK will be in: `android/app/build/outputs/apk/debug/` or `release/`

**Option B - Using Command Line:**
```bash
cd D:\POS\POS-ADVANCED\mobileapp\android
.\gradlew assembleRelease
```

**APK Location:** `android/app/build/outputs/apk/release/app-release.apk`

### Step 4: Sign APK (Optional, for release)

For production releases, you'll want to sign the APK:

1. Generate keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure signing in `android/app/build.gradle`

---

## 🆘 Troubleshooting Local Builds

### Error: "gradlew is not recognized"
**Solution:** Make sure you're in the `android` directory and use `.\gradlew` (Windows) or `./gradlew` (Mac/Linux)

### Error: "JAVA_HOME not set"
**Solution:**
```bash
# Windows PowerShell:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
# Or set it permanently in System Environment Variables
```

### Error: "SDK location not found"
**Solution:**
- Open Android Studio
- Go to **File → Project Structure → SDK Location**
- Copy the SDK path
- Create `android/local.properties` file:
```
sdk.dir=C:/Users/YourUsername/AppData/Local/Android/Sdk
```

### Error: Build fails with dependency issues
**Solution:**
```bash
cd mobileapp/android
.\gradlew clean
.\gradlew assembleRelease
```

---

## 📊 Comparison Table

| Method | Setup Time | Cost | Build Time | Difficulty |
|--------|-----------|------|------------|-----------|
| **EAS Build** | 5 min | Free tier | 15-20 min | Easy |
| **Local Build** | 30-60 min | Free | 5-10 min | Medium |
| **GitHub Actions** | 30 min | Free | 10-15 min | Medium |
| **Bitrise** | 20 min | Free tier | 10-15 min | Medium |
| **CircleCI** | 45 min | Free tier | 10-15 min | Hard |

---

## 🎯 My Recommendation

Given your EAS Build issues, **start with Local Build (Method 1)**:

1. Install Android Studio and JDK
2. Run `npx expo prebuild --platform android`
3. Build APK locally with `.\gradlew assembleRelease`

This will:
- ✅ Work around EAS Build issues
- ✅ Give you more control
- ✅ Allow you to debug build problems
- ✅ Be faster for subsequent builds

Once you have the build working locally, you can always go back to EAS Build or set up GitHub Actions for automation.
