# Fix: Java Version Error - "Unsupported class file major version 69"

## The Problem

You have Java 25 installed, but Gradle 8.3 (used by Expo) only supports up to Java 20.

**Error:** `Unsupported class file major version 69`

## Solution: Install JDK 17 (Recommended)

JDK 17 is the recommended version for React Native and Expo projects.

### Step 1: Download JDK 17

1. Visit: https://adoptium.net/temurin/releases/
2. Select:
   - **Version**: 17 (LTS)
   - **Operating System**: Windows
   - **Architecture**: x64
   - **Package Type**: JDK
3. Download and run the installer

### Step 2: Install JDK 17

- Run the installer
- Install to default location: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\`
- **Important:** Note the installation path!

### Step 3: Set JAVA_HOME Environment Variable

#### Option A: Using PowerShell (Temporary - Current Session Only)

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
java -version  # Verify it shows Java 17
```

#### Option B: Set Permanently (Recommended)

1. **Open System Properties:**
   - Press `Win + X` → **System**
   - Or right-click **This PC** → **Properties**
   - Click **Advanced system settings**

2. **Set JAVA_HOME:**
   - Click **Environment Variables**
   - Under **System variables**, click **New**
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot`
     (Adjust version number to match your installation)
   - Click **OK**

3. **Update PATH:**
   - Find **Path** in System variables
   - Click **Edit**
   - Click **New**
   - Add: `%JAVA_HOME%\bin`
   - Move it to the top of the list (important!)
   - Click **OK** on all dialogs

4. **Verify:**
   - Close and reopen your terminal/PowerShell
   - Run: `java -version`
   - Should show: `openjdk version "17.x.x"`

### Step 4: Clean Gradle Cache

```powershell
cd D:\POS\POS-ADVANCED\mobileapp\android
# Clean Gradle cache
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches
```

### Step 5: Retry Build

```powershell
cd D:\POS\POS-ADVANCED\mobileapp\android
.\gradlew clean
.\gradlew assembleRelease
```

---

## Alternative: Use Java 17 Only for This Build (Without Changing System)

If you want to keep Java 25 for other projects, you can specify Java 17 just for this build:

### Option 1: Set JAVA_HOME in Build Script

Create a batch file `build-apk.bat` in the `android` folder:

```batch
@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
gradlew assembleRelease
```

Then run: `.\build-apk.bat`

### Option 2: Specify Java Path in Gradle

Edit `android/gradle.properties` and add:

```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.13.11-hotspot
```

(Use double backslashes `\\` in Windows paths)

---

## Quick Fix Script

Create a PowerShell script to switch Java versions temporarily:

**Save as `use-java17.ps1`:**

```powershell
$jdk17Path = "C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot"

if (Test-Path $jdk17Path) {
    $env:JAVA_HOME = $jdk17Path
    $env:PATH = "$jdk17Path\bin;$env:PATH"
    Write-Host "Switched to Java 17" -ForegroundColor Green
    java -version
} else {
    Write-Host "JDK 17 not found at: $jdk17Path" -ForegroundColor Red
    Write-Host "Please install JDK 17 from: https://adoptium.net/" -ForegroundColor Yellow
}
```

**Usage:**
```powershell
cd D:\POS\POS-ADVANCED\mobileapp
.\use-java17.ps1
cd android
.\gradlew assembleRelease
```

---

## Verify Java Version

After setting JAVA_HOME, verify:

```powershell
java -version
# Should show: openjdk version "17.x.x"

echo $env:JAVA_HOME
# Should show your JDK 17 path
```

---

## Troubleshooting

### "Java not found" after setting JAVA_HOME

**Solution:**
1. Make sure PATH includes `%JAVA_HOME%\bin`
2. Close and reopen terminal
3. Restart computer if needed

### Multiple Java versions installed

**Check which Java is being used:**
```powershell
where.exe java
```

This shows all Java installations in PATH order. The first one is used.

**To prioritize Java 17:**
- Move `%JAVA_HOME%\bin` to the top of PATH
- Or remove other Java installations from PATH temporarily

### Gradle still uses old Java

**Solution:**
1. Clean Gradle cache: `Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches`
2. Delete `android/.gradle` folder: `Remove-Item -Recurse -Force android\.gradle`
3. Retry build

### "Permission denied" errors

**Solution:**
- Run PowerShell as Administrator
- Or change JAVA_HOME in user environment variables instead of system variables

---

## Recommended: Use Java Version Manager (Advanced)

For managing multiple Java versions easily:

### SDKMAN (If using WSL/Git Bash)
```bash
sdk install java 17.0.13-tem
sdk use java 17.0.13-tem
```

### jEnv (Windows)
A Java version manager for Windows that makes switching easier.

---

## Summary

1. **Install JDK 17** from https://adoptium.net/
2. **Set JAVA_HOME** to JDK 17 path
3. **Update PATH** to include `%JAVA_HOME%\bin`
4. **Clean Gradle cache**
5. **Retry build**

After fixing Java version, your build should succeed!
