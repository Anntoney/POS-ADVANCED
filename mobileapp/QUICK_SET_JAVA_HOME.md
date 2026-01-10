# Quick Guide: Set JAVA_HOME (No Scripts Needed)

## ✅ Easiest Method: Using GUI (No Admin Scripts)

### Step-by-Step:

1. **Open System Properties:**
   - Press `Win + X` 
   - Click **System** (or press `Y`)
   - OR Right-click **This PC** → **Properties**

2. **Open Environment Variables:**
   - On the left, click **Advanced system settings**
   - At the bottom, click **Environment Variables** button

3. **Create JAVA_HOME:**
   - In the **System variables** section (bottom half), click **New...**
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Java\jdk-17`
   - Click **OK**

4. **Update PATH:**
   - In **System variables**, find **Path**
   - Click **Edit...**
   - Click **New**
   - Type: `%JAVA_HOME%\bin`
   - Click **Move Up** until it's at the top (important!)
   - Click **OK** on all dialogs

5. **Done!** 
   - Close ALL terminal/PowerShell windows
   - Open a NEW terminal
   - Run: `java -version` (should show Java 17)

---

## 🔧 Alternative: Command Line (As Administrator)

If you prefer command line, run PowerShell **as Administrator**:

```powershell
# Set JAVA_HOME
setx JAVA_HOME "C:\Program Files\Java\jdk-17" /M

# Get current PATH and add JDK bin to front
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
$newPath = "C:\Program Files\Java\jdk-17\bin;$currentPath"
setx PATH "$newPath" /M
```

**Note:** `/M` flag requires Administrator privileges.

---

## ✅ Verify It Worked

After setting JAVA_HOME:

1. **Close and reopen terminal** (important!)

2. **Check JAVA_HOME:**
   ```powershell
   echo $env:JAVA_HOME
   # Should show: C:\Program Files\Java\jdk-17
   ```

3. **Check Java version:**
   ```powershell
   java -version
   # Should show: java version "17.0.12" or similar
   ```

4. **Check which Java is being used:**
   ```powershell
   where.exe java
   # Should show: C:\Program Files\Java\jdk-17\bin\java.exe
   ```

---

## 🚀 Build Your APK Now

Once JAVA_HOME is set, build your APK:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp\android

# Clean old Gradle cache (important!)
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches -ErrorAction SilentlyContinue

# Clean build
.\gradlew clean

# Build APK
.\gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🆘 Troubleshooting

### "java -version still shows Java 25"

**Fix:**
1. Make sure you closed and reopened the terminal
2. Check PATH order: `$env:PATH -split ';' | Select-Object -First 5`
3. JDK 17 bin should be first in the list
4. If not, move `%JAVA_HOME%\bin` to the top of PATH in Environment Variables

### "JAVA_HOME is empty"

**Fix:**
1. Verify JAVA_HOME was created in System variables (not User variables)
2. Close all terminals and reopen
3. Check: `[System.Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")`

### "Permission denied" when using setx

**Fix:**
- You must run PowerShell as Administrator
- Or use the GUI method instead (no admin needed for GUI)

---

## 💡 Why GUI Method is Recommended

- ✅ No PowerShell execution policy issues
- ✅ Visual confirmation of what's being set
- ✅ Easy to verify settings
- ✅ Works even if scripts are blocked
- ✅ You can see existing environment variables

---

## 📝 Summary

**Fastest way:** Use GUI method (Win + X → System → Advanced → Environment Variables)

**Steps:**
1. Set `JAVA_HOME` = `C:\Program Files\Java\jdk-17`
2. Add `%JAVA_HOME%\bin` to PATH (move to top)
3. Restart terminal
4. Verify with `java -version`
5. Build APK!
