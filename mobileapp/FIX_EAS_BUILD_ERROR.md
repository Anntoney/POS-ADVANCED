# Fixing EAS Build Gradle Error

Your Android build failed with a Gradle error. Here's how to fix it:

## 🔍 Step 1: Check Detailed Build Logs

The build logs contain the exact error. Visit this URL to see detailed logs:
```
https://expo.dev/accounts/iamantoney/projects/pos-admin-mobile/builds/d1504eaa-1208-42ca-9987-ade317a76142
```

Or use the EAS CLI:
```bash
cd mobileapp
eas build:view d1504eaa-1208-42ca-9987-ade317a76142
```

## 🔧 Common Fixes

### Fix 1: Clear Cache and Rebuild

Sometimes cached build artifacts cause issues:

```bash
cd mobileapp
eas build --profile preview --platform android --clear-cache
```

### Fix 2: Check Asset Files

Ensure all required assets exist:

```bash
cd mobileapp
# Check these files exist:
ls assets/icon.png
ls assets/splash.png
ls assets/adaptive-icon.png
```

If any are missing, they need to be created. Minimum sizes:
- **icon.png**: 1024x1024px
- **splash.png**: 1284x2778px (iPhone) or 1242x2436px
- **adaptive-icon.png**: 1024x1024px

### Fix 3: Update Android Configuration

Add explicit Android SDK version to `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.pos.admin",
      "versionCode": 1,
      "compileSdkVersion": 34,
      "targetSdkVersion": 34,
      "minSdkVersion": 21,
      "permissions": []
    }
  }
}
```

### Fix 4: Check for Dependency Issues

Some packages may not be compatible with Expo SDK 50. Check if you're using any packages that require native code not supported by Expo.

Remove `react-native-vector-icons` from dependencies if not needed (you're using emojis now):

```bash
cd mobileapp
npm uninstall react-native-vector-icons
```

### Fix 5: Update EAS Build Configuration

Add explicit build configuration to `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### Fix 6: Check Package Name Conflicts

The package name `com.pos.admin` might already be in use. Try a more unique name:

In `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.posadmin"
    }
  }
}
```

## 🔨 Quick Fix: Try Building with Development Profile First

Test with the development profile which has fewer restrictions:

```bash
cd mobileapp
eas build --profile development --platform android
```

If this works, the issue is specific to the preview profile configuration.

## 🚀 Recommended Fix Sequence

Try these in order:

### 1. Remove potentially problematic package:
```bash
cd mobileapp
npm uninstall react-native-vector-icons
```

### 2. Update app.json with explicit Android config:
See Fix 3 above

### 3. Clear cache and rebuild:
```bash
eas build --profile preview --platform android --clear-cache
```

### 4. If still failing, check the actual error in logs:
Visit the build logs URL or run:
```bash
eas build:view d1504eaa-1208-42ca-9987-ade317a76142
```

## 📋 Most Likely Issues (Based on Your Setup)

1. **Missing react-native-vector-icons**: You removed Ionicons but the package might still be referenced
   - **Fix**: `npm uninstall react-native-vector-icons`

2. **Asset file issues**: Missing or incorrectly sized images
   - **Fix**: Ensure all assets exist and are properly sized

3. **SDK version mismatch**: Some dependency incompatible with Expo SDK 50
   - **Fix**: Check build logs for specific package errors

4. **Gradle configuration**: Default Gradle settings might need adjustment
   - **Fix**: Add explicit Gradle command in eas.json

## 🔍 Getting Detailed Error Information

The build logs will show the exact line where Gradle failed. Common errors include:

- **"Task :app:processReleaseResources FAILED"**: Asset or resource issue
- **"Task :app:mergeReleaseResources FAILED"**: Resource conflict
- **"Could not resolve all dependencies"**: Package dependency issue
- **"Execution failed for task ':app:compileReleaseJavaWithJavac'"**: Java/SDK version issue

## ⚠️ Important Notes

- **Don't try to run `gradlew` locally**: This is an Expo managed project - builds happen in the cloud
- **The error is in EAS Build, not your local machine**: Check the build logs URL
- **First builds often take longer**: 15-30 minutes is normal
- **Subsequent builds are faster**: Due to caching

## 🆘 Still Not Working?

1. **Check Expo Status**: Visit [status.expo.dev](https://status.expo.dev) for service issues
2. **Check EAS Build Status**: Visit [expo.dev/builds](https://expo.dev/builds)
3. **Try a minimal test build**:
   ```bash
   # Create a minimal test to verify EAS Build works
   npx create-expo-app test-build
   cd test-build
   eas build --profile preview --platform android
   ```
   If this works, the issue is with your project configuration.

4. **Contact Expo Support**: If you have a paid EAS plan, contact support with your build ID

## 📝 Next Steps

After fixing the issue:
1. Rebuild: `eas build --profile preview --platform android --clear-cache`
2. Wait for completion (10-20 minutes)
3. Download APK from the build dashboard
4. Test on your Android device
