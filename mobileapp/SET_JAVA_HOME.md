# How to Set JAVA_HOME to JDK 17

## ✅ Quick Method (Current Session Only)

For this PowerShell session only, run:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
java -version  # Verify it shows Java 17
```

**Note:** This only works for the current terminal session. Close the terminal and you'll need to set it again.

---

## 🔧 Permanent Method (Recommended)

### Method 1: Using GUI (Easiest)

1. **Open System Properties:**
   - Press `Win + X` → Click **System**
   - Or right-click **This PC** → **Properties**
   - Click **Advanced system settings** (on the left)

2. **Open Environment Variables:**
   - Click **Environment Variables** button (at the bottom)

3. **Set JAVA_HOME:**
   - Under **System variables** (bottom section), click **New**
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Java\jdk-17`
   - Click **OK**

4. **Update PATH:**
   - Find **Path** in the System variables list
   - Click **Edit**
   - Click **New**
   - Add: `%JAVA_HOME%\bin`
   - **Important:** Click **Move Up** to move it to the top of the list
   - Click **OK** on all dialogs

5. **Restart Terminal:**
   - Close all PowerShell/Command Prompt windows
   - Open a new terminal
   - Verify: `java -version` (should show Java 17)

---

### Method 2: Using PowerShell Script (As Administrator)

1. **Run PowerShell as Administrator:**
   - Press `Win + X`
   - Click **Windows PowerShell (Admin)** or **Terminal (Admin)**

2. **Run the script:**
   ```powershell
   cd D:\POS\POS-ADVANCED\mobileapp
   .\set-java-home-permanent.ps1
   ```

3. **Close and reopen terminal**

---

### Method 3: Using Command Line (As Administrator)

1. **Open Command Prompt as Administrator**

2. **Set JAVA_HOME:**
   ```cmd
   setx JAVA_HOME "C:\Program Files\Java\jdk-17" /M
   ```

3. **Update PATH:**
   ```cmd
   setx PATH "%JAVA_HOME%\bin;%PATH%" /M
   ```

4. **Close and reopen terminal**

---

## ✅ Verify JAVA_HOME is Set

After setting JAVA_HOME, verify it works:

```powershell
# Check JAVA_HOME
echo $env:JAVA_HOME
# Should show: C:\Program Files\Java\jdk-17

# Check Java version
java -version
# Should show: java version "17.x.x"

# Check which Java is being used
where.exe java
# Should show: C:\Program Files\Java\jdk-17\bin\java.exe
```

---

## 🚀 Now Build Your APK

Once JAVA_HOME is set, you can build:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp\android

# Clean Gradle cache (important after changing Java)
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches -ErrorAction SilentlyContinue

# Clean build
.\gradlew clean

# Build APK
.\gradlew assembleRelease
```

---

## 🆘 Troubleshooting

### "JAVA_HOME not found" after setting

**Solution:**
1. Make sure you closed and reopened the terminal
2. Verify JAVA_HOME: `echo $env:JAVA_HOME`
3. If empty, the environment variable wasn't set correctly
4. Try setting it again using Method 1 (GUI)

### "Java version still shows 25"

**Solution:**
1. Check PATH order: `$env:PATH -split ';'`
2. Make sure `%JAVA_HOME%\bin` is at the top of PATH
3. Remove other Java installations from PATH temporarily
4. Or use the temporary method for this session

### "Permission denied" when setting

**Solution:**
- You need Administrator privileges
- Right-click PowerShell → Run as Administrator
- Or use the GUI method (Method 1)

---

## 📝 Summary

**For current session (temporary):**
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

**For permanent (system-wide):**
- Use GUI: Win + X → System → Advanced → Environment Variables
- Set JAVA_HOME = `C:\Program Files\Java\jdk-17`
- Add `%JAVA_HOME%\bin` to PATH (at the top)
- Restart terminal
