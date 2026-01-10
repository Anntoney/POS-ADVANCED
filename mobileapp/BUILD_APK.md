# Building an APK for POS Admin Mobile App

This guide will help you generate an APK file for your POS Admin mobile application.

## Prerequisites

1. **Node.js** installed (version 18 or higher)
2. **Expo account** (free account works fine)
3. **EAS CLI** installed

## Step 1: Install EAS CLI

If you haven't installed EAS CLI yet, run:

```bash
npm install -g eas-cli
```

Or if you prefer using npx (no installation needed):
```bash
npx eas-cli --version
```

## Step 2: Login to Expo

Authenticate with your Expo account:

```bash
eas login
```

If you don't have an account, create one at [expo.dev](https://expo.dev)

## Step 3: Configure Build (if needed)

The project already has `eas.json` configured with a "preview" profile that builds APK files. You can check the configuration:

- **Preview profile**: Builds APK for testing/distribution
- **Production profile**: Builds AAB (Android App Bundle) for Play Store

## Step 4: Build APK

You have two options:

### Option A: Using the npm script (Easiest)

```bash
cd mobileapp
npm run build:apk
```

### Option B: Using EAS CLI directly

```bash
cd mobileapp
eas build --profile preview --platform android
```

## Step 5: Download the APK

After the build completes (usually takes 10-20 minutes):

1. EAS will provide a download link in the terminal
2. Or visit [expo.dev/builds](https://expo.dev/builds) to download
3. Click on your build and download the APK file

## Build Profiles Available

Based on your `eas.json`:

### 1. **Preview Profile** (Builds APK)
```bash
npm run build:apk
# or
eas build --profile preview --platform android
```
- Builds an APK file (good for direct installation/testing)
- Distribution: Internal
- Build type: APK

### 2. **Development Profile** (Development client)
```bash
npm run build:dev:android
# or
eas build --profile development --platform android
```
- Builds a development client for testing
- Includes development tools

### 3. **Production Profile** (AAB for Play Store)
```bash
eas build --profile production --platform android
```
- Builds an Android App Bundle (AAB)
- Required for Google Play Store submission
- Not an APK - converts to APK automatically when downloaded from Play Store

## Important Notes

1. **First build**: May take longer (15-30 minutes) as EAS sets up the build environment
2. **Subsequent builds**: Usually faster (10-15 minutes) due to caching
3. **Build queue**: During peak times, builds may wait in queue
4. **Build limits**: Free Expo accounts have monthly build limits, but sufficient for development

## Local Build (Advanced - Optional)

If you want to build locally instead of using EAS cloud build:

### Prerequisites:
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK) installed

### Steps:

1. **Generate native code**:
```bash
cd mobileapp
npx expo prebuild --platform android
```

2. **Build APK locally**:
```bash
cd android
./gradlew assembleRelease
```

The APK will be located at: `android/app/build/outputs/apk/release/app-release.apk`

**Note**: Local builds require more setup and are generally more complex. EAS Build is recommended for most users.

## Troubleshooting

### Build fails with authentication error:
```bash
eas login
eas whoami  # Verify you're logged in
```

### Build fails with configuration error:
- Check that `eas.json` exists and is valid
- Verify `app.json` has all required fields
- Ensure package name is unique: `com.pos.admin`

### Need to rebuild:
```bash
eas build --profile preview --platform android --clear-cache
```

### Check build status:
Visit [expo.dev/builds](https://expo.dev/builds) or run:
```bash
eas build:list
```

## Installing the APK

Once you download the APK:

1. Transfer to your Android device
2. Enable "Install from Unknown Sources" in Android settings
3. Open the APK file and install
4. Or use ADB to install:
   ```bash
   adb install path/to/app.apk
   ```

## Cost

- **EAS Build**: Free tier includes a generous number of builds per month
- **Paid plans**: Available for higher build limits and priority builds

For more information, visit: [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
