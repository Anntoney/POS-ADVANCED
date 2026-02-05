# Build APK - Quick Reference

## 🚀 Fastest Method (5 Commands)

```cmd
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Go to your project
cd mobileapp

# 4. Configure (first time only)
eas build:configure

# 5. Build APK
eas build --platform android --profile preview
```

**Wait 10-20 minutes** → Get download link → Install APK on phone

---

## 📱 What You Need

1. **Expo Account** (free)
   - Sign up at: https://expo.dev
   
2. **Internet Connection**
   - Build happens in the cloud

3. **Android Phone**
   - To test the APK

---

## 🎯 Step-by-Step

### First Time Setup (5 minutes)

1. **Install EAS CLI:**
   ```cmd
   npm install -g eas-cli
   ```

2. **Create Expo Account:**
   - Go to https://expo.dev
   - Click "Sign Up"
   - Verify email

3. **Login:**
   ```cmd
   eas login
   ```
   Enter your Expo credentials

### Every Build (2 minutes + wait time)

1. **Navigate to project:**
   ```cmd
   cd mobileapp
   ```

2. **Build APK:**
   ```cmd
   eas build --platform android --profile preview
   ```

3. **Wait for build:**
   - Takes 10-20 minutes
   - You'll see progress in terminal
   - You can close terminal and check later

4. **Download APK:**
   - Click the link in terminal, OR
   - Run: `eas build:list`
   - Download from browser

5. **Install on phone:**
   - Transfer APK to phone
   - Open and install
   - Allow "Unknown sources" if asked

---

## 🔍 Check Build Status

```cmd
# See all your builds
eas build:list

# Download latest build
eas build:download --platform android
```

---

## ⚙️ Before First Build

Update `app.json` with unique package name:

```json
{
  "expo": {
    "android": {
      "package": "com.yourstore.adminapp"
    }
  }
}
```

Change `com.yourstore.adminapp` to something unique.

---

## 🐛 Troubleshooting

### "eas: command not found"
```cmd
npm install -g eas-cli
```

### "Not logged in"
```cmd
eas login
```

### "Build failed"
1. Check `app.json` has valid package name
2. Make sure all dependencies installed: `npm install`
3. Try again: `eas build --platform android --profile preview`

### Can't install APK
1. Enable "Install from unknown sources" in phone settings
2. Settings → Security → Unknown sources → Enable

---

## 💰 Cost

**FREE!** ✅
- Expo provides free builds
- No credit card required
- Unlimited builds

---

## 📦 Build Types

### Preview (APK) - For Testing
```cmd
eas build --platform android --profile preview
```
- Direct install on phone
- Good for testing
- Share with team

### Production (AAB) - For Play Store
```cmd
eas build --platform android --profile production
```
- For Google Play Store
- Optimized and signed
- Requires Play Store account ($25)

---

## ⏱️ Timeline

| Step | Time |
|------|------|
| Install EAS CLI | 1 min |
| Create account | 2 min |
| Configure project | 1 min |
| Start build | 1 min |
| **Build in cloud** | **10-20 min** |
| Download APK | 1 min |
| Install on phone | 1 min |
| **Total** | **~20-30 min** |

---

## 📱 After Building

1. **Test everything:**
   - Login works
   - All tabs work
   - Dark mode works
   - Currency displays correctly
   - Stock management works
   - Sales and debts load

2. **Share APK:**
   - Upload to Google Drive
   - Share link with team
   - Or email APK file

3. **Update app:**
   - Make changes
   - Run build again
   - Users must uninstall old version first

---

## 🎯 Pro Tips

1. **Test in Expo Go first** before building
2. **Increment version** in app.json for each build
3. **Keep build links** - they expire after 30 days
4. **Use production profile** only for Play Store
5. **Save your keystore** if you generate one

---

## 📞 Need Help?

- Full guide: See `BUILD_APK_GUIDE.md`
- Expo docs: https://docs.expo.dev/build/setup/
- Support: https://expo.dev/support

---

## ✅ Quick Checklist

Before building:
- [ ] App works in Expo Go
- [ ] Updated package name in app.json
- [ ] Logged into EAS CLI
- [ ] Internet connection stable

After building:
- [ ] Downloaded APK
- [ ] Installed on test device
- [ ] Tested all features
- [ ] Ready to share!

---

**Remember:** First build takes longest (setup). After that, it's just one command! 🚀
