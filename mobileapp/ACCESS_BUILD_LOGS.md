# How to Access Detailed EAS Build Logs

Your build failed at the "Run gradlew" step. Here's how to see the detailed error:

## 🔍 Step 1: Click on the Annotation Icon

In the build log interface, you'll see:
- **"Run gradlew"** step with a red ❌
- A grey pill-shaped button with a speech bubble icon and "1" next to it

**Click on that annotation icon** - it will show you:
- What the error is
- Why it occurred
- Suggestions on how to fix it

## 📋 Step 2: Expand the "Run gradlew" Step

1. Click on **"Run gradlew"** (the line with the red X)
2. This will expand to show the full Gradle output
3. Scroll through the logs to find the actual error message

Look for lines like:
- `FAILURE: Build failed with an exception.`
- `* What went wrong:`
- `* Try:`
- Error messages in red

## 🎯 Common Gradle Errors and Fixes

Based on the annotation and logs, here are the most common issues:

### Error 1: "Task :app:processReleaseResources FAILED"
**Cause**: Missing or invalid asset files  
**Fix**:
```bash
# Ensure all assets exist and are properly sized:
# - assets/icon.png (1024x1024px)
# - assets/splash.png (1284x2778px)
# - assets/adaptive-icon.png (1024x1024px)
```

### Error 2: "Could not resolve all dependencies"
**Cause**: Package dependency conflicts  
**Fix**:
```bash
cd mobileapp
npm install
# Check for any package warnings or errors
```

### Error 3: "Execution failed for task ':app:compileReleaseJavaWithJavac'"
**Cause**: Java/SDK version mismatch  
**Fix**: Usually resolved by EAS automatically, but check if annotation suggests SDK version updates

### Error 4: "AAPT: error: resource android:attr/..."
**Cause**: Android resource conflicts  
**Fix**: Usually means a dependency is incompatible with Expo SDK 50

### Error 5: "No matching variant of ..."
**Cause**: Dependency version incompatibility  
**Fix**: The annotation will suggest which package to update or remove

## 🚀 Quick Actions to Try

While you check the logs, try these fixes:

### Fix 1: Remove @react-navigation packages (if annotation suggests)
If you're using `expo-router`, you might not need `@react-navigation` packages:
```bash
cd mobileapp
npm uninstall @react-navigation/bottom-tabs @react-navigation/native @react-navigation/native-stack
```

### Fix 2: Update Expo SDK (if needed)
```bash
cd mobileapp
npx expo install --fix
```

### Fix 3: Check for incompatible packages
Common incompatible packages with Expo SDK 50:
- `react-native-vector-icons` (already removed ✅)
- Some older versions of navigation packages

### Fix 4: Clean and rebuild
```bash
cd mobileapp
# Clear all caches
rm -rf .expo node_modules/.cache

# Rebuild with cache cleared
eas build --profile preview --platform android --clear-cache
```

## 📝 What to Look For in the Logs

When you expand "Run gradlew", search for these keywords in the logs:

1. **"FAILURE"** - Marks where the build actually failed
2. **"error:"** - The specific error message
3. **"Caused by:"** - The root cause
4. **Package names** - Which package is causing issues
5. **Line numbers** - Where in the Gradle files the error occurred

## 🆘 Share the Error Details

Once you've found the error message, it will typically look like:

```
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:processReleaseResources'.
> A failure occurred while executing com.android.build.gradle.internal.tasks.Workers$ActionFacade
   > Android resource linking failed
     ERROR: Resource type "..." not found.
```

Share this error message and I can provide a specific fix!

## 💡 Alternative: Try Development Build First

If the preview build keeps failing, try building a development version first (has fewer restrictions):

```bash
cd mobileapp
eas build --profile development --platform android
```

This can help identify if the issue is specific to the release/preview build configuration.
