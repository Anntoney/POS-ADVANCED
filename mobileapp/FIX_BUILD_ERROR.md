# Fix Build Error - npm ci failed

## The Problem

Build failed with: `npm ci --include=dev exited with non-zero code: 1`

This means there's an issue with your dependencies or lock files.

## 🔧 Solution

### Step 1: Clean Your Project

```cmd
cd D:\MAIN PROJECT\POS-ADVANCED\mobileapp

# Delete node_modules
rmdir /s /q node_modules

# Delete package-lock.json
del package-lock.json
```

### Step 2: Reinstall Dependencies

```cmd
npm install --legacy-peer-deps
```

### Step 3: Verify package.json

Make sure your `package.json` looks correct. Run:
```cmd
type package.json
```

### Step 4: Try Building Again

```cmd
eas build --platform android --profile preview
```

---

## 🔍 Alternative: Check for Specific Issues

### Issue 1: React Version Conflict

Your package.json might have React version issues. Let me check:

**Open `mobileapp/package.json` and verify:**
- React version should be compatible with Expo SDK 54
- All dependencies should be compatible

### Issue 2: Missing Dependencies

Run this to ensure all dependencies are installed:
```cmd
npm install --legacy-peer-deps
npx expo install --fix
```

### Issue 3: Lock File Issues

If you have both `package-lock.json` and `pnpm-lock.yaml`, delete one:

```cmd
# If using npm (recommended)
del pnpm-lock.yaml

# If using pnpm
del package-lock.json
```

---

## 🎯 Complete Fix (Try This First)

```cmd
# 1. Go to project
cd D:\MAIN PROJECT\POS-ADVANCED\mobileapp

# 2. Clean everything
rmdir /s /q node_modules
del package-lock.json

# 3. Reinstall
npm install --legacy-peer-deps

# 4. Fix Expo dependencies
npx expo install --fix

# 5. Try build again
eas build --platform android --profile preview
```

---

## 🐛 If Still Failing

### Check Build Logs

When build fails, EAS gives you a link to logs. Look for:
- "Cannot find module"
- "Version mismatch"
- "Peer dependency"

### Common Fixes

**Fix 1: Update Expo CLI**
```cmd
npm install -g expo-cli@latest
npm install -g eas-cli@latest
```

**Fix 2: Clear EAS Cache**
```cmd
eas build --platform android --profile preview --clear-cache
```

**Fix 3: Use Different Node Version**
Check your Node version:
```cmd
node --version
```

Should be Node 18 or higher. If not, update Node.js.

---

## 📋 Checklist Before Building

- [ ] Node.js 18+ installed
- [ ] No `node_modules` folder (deleted)
- [ ] No `package-lock.json` (deleted)
- [ ] Ran `npm install --legacy-peer-deps`
- [ ] No errors during npm install
- [ ] Internet connection stable

---

## 🔄 Start Fresh (Nuclear Option)

If nothing works, start completely fresh:

```cmd
# 1. Go to parent folder
cd D:\MAIN PROJECT\POS-ADVANCED

# 2. Backup your code
# Copy mobileapp folder to mobileapp-backup

# 3. Delete problematic files
cd mobileapp
rmdir /s /q node_modules
rmdir /s /q .expo
del package-lock.json
del pnpm-lock.yaml

# 4. Clean install
npm cache clean --force
npm install --legacy-peer-deps

# 5. Build
eas build --platform android --profile preview --clear-cache
```

---

## 💡 Pro Tip

Add this to your `package.json` to avoid future issues:

```json
{
  "resolutions": {
    "react": "19.1.0",
    "react-native": "0.81.5"
  }
}
```

---

## 🆘 Still Not Working?

Share the full error log:
1. When build fails, click the build link
2. Copy the error message
3. Look for lines with "ERROR" or "FAILED"

Common errors and fixes:
- **"Cannot resolve module"** → Missing dependency, run `npm install`
- **"Version mismatch"** → Run `npx expo install --fix`
- **"Gradle error"** → Android build issue, try `--clear-cache`
- **"Out of memory"** → EAS server issue, try again later

---

**Try the "Complete Fix" section first!** 🚀
