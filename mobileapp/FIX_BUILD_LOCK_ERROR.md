# Fix: "Could not delete" Build Error

## The Problem

Error: `Could not delete 'D:\POS\POS-ADVANCED\mobileapp\node_modules\expo-dev-launcher\expo-dev-launcher-gradle-plugin\build\kotlin\compileKotlin\cacheable\caches-jvm'`

This happens when:
- Files are locked by another process (IDE, antivirus, file explorer)
- Build cache is corrupted
- Permissions issue

## Quick Fix

### Step 1: Close All Processes

Close:
- Android Studio (if open)
- VS Code / IDE with the project open
- Any file explorer windows showing the project folder
- Metro bundler (if running)
- Any Gradle daemon processes

### Step 2: Clean Build Directories

```powershell
cd D:\POS\POS-ADVANCED\mobileapp

# Remove expo-dev-launcher build cache
Remove-Item -Recurse -Force "node_modules\expo-dev-launcher\expo-dev-launcher-gradle-plugin\build" -ErrorAction SilentlyContinue

# Clean Android build directories
cd android
Remove-Item -Recurse -Force .gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue

# Clean Gradle user cache
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches -ErrorAction SilentlyContinue
```

### Step 3: Kill Gradle Daemon

```powershell
cd D:\POS\POS-ADVANCED\mobileapp\android
.\gradlew --stop
```

### Step 4: Retry Build

```powershell
.\gradlew clean
.\gradlew assembleRelease
```

---

## Alternative: Build Without Dev Launcher

Since you're building a release APK (not development build), you can try removing expo-dev-client which includes the dev launcher:

### Option 1: Build Debug APK Instead

Debug builds are simpler and don't use dev launcher:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp\android
.\gradlew assembleDebug
```

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Remove Dev Client (For Release Only)

If you only need release APK and not development builds:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npm uninstall expo-dev-client
npx expo prebuild --platform android --clean
cd android
.\gradlew assembleRelease
```

**Note:** This removes development build capability. You can reinstall later if needed.

---

## Advanced: Use Stop Script

Create a script to stop all processes:

```powershell
# Stop Gradle daemon
cd D:\POS\POS-ADVANCED\mobileapp\android
.\gradlew --stop

# Kill any Java processes related to Gradle (use with caution)
Get-Process | Where-Object {$_.ProcessName -like "*java*" -and $_.Path -like "*gradle*"} | Stop-Process -Force
```

---

## If Still Failing: Use Build Profile

Try building with a different configuration:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp\android
.\gradlew assembleDebug --no-daemon
```

The `--no-daemon` flag prevents Gradle from running in the background, which can help with locked files.

---

## Nuclear Option: Restart Computer

If nothing else works:
1. Restart your computer (this closes all processes)
2. Immediately try building again
3. Don't open any IDEs or file explorers in the project folder

---

## Recommended: Build Debug APK First

Debug APKs are easier to build and don't have as many restrictions:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp\android
.\gradlew clean
.\gradlew assembleDebug
```

You can install and test the debug APK. It works the same, just includes development tools.
