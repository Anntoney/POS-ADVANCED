# Quick Start Guide

Get the admin mobile app running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd mobileapp
npm install
```

## Step 2: Start the App

```bash
npm start
```

This will open the Expo DevTools in your browser and show a QR code in the terminal.

## Step 3: Run on Your Device

### Option A: Physical Device (Easiest)

1. **Install Expo Go**:
   - iOS: Download from App Store
   - Android: Download from Play Store

2. **Scan QR Code**:
   - iOS: Open Camera app and scan the QR code
   - Android: Open Expo Go app and scan the QR code

3. **Wait for Build**: The app will load on your device

### Option B: iOS Simulator (Mac Only)

```bash
npm run ios
```

Requires Xcode installed.

### Option C: Android Emulator

```bash
npm run android
```

Requires Android Studio and an emulator set up.

## Step 4: Login

Use your admin credentials:
- **Email**: Your admin email from the main system
- **Password**: Your admin password

**Important**: Only users with the "admin" role can access this app.

## Common Issues

### "Wrong Supabase Project / Wrong Data"
**This is the most common issue!**
- Expo caches environment variables
- **Fix**: Run `npm run start:clear` instead of `npm start`
- See `FIX_NOW.md` for detailed steps

### "Cannot connect to Metro"
- Make sure you're on the same WiFi network
- Try running: `expo start --tunnel`

### "Login failed"
- Verify your user role is "admin" in the database
- Check Supabase credentials in `.env` file

### "Module not found"
- Clear cache: `expo start -c`
- Reinstall: `rm -rf node_modules && npm install`

### Date picker not working
- Install missing dependency: `npx expo install @react-native-community/datetimepicker`

## What You Can Do

Once logged in, you can:

1. **Stock Tab**: 
   - View all products
   - Add or deduct stock
   - Update prices
   - Search products

2. **Sales Tab**:
   - View sales by date range
   - See total sales amount
   - Check payment status

3. **Debts Tab**:
   - View customers with outstanding balances
   - See total debt amount
   - Access customer details

4. **Returns Tab**:
   - View all returns
   - See refund details
   - Track return reasons

5. **Profile Tab**:
   - View your profile
   - Logout

## Development Tips

### Hot Reload
- Shake your device to open developer menu
- Enable "Fast Refresh" for instant updates

### Debugging
- Press `j` in terminal to open debugger
- Use `console.log()` to debug
- Check terminal for errors

### Testing Changes
- Save any file to see changes instantly
- No need to rebuild the app

## Next Steps

1. **Customize**: Update colors and branding in screen files
2. **Add Assets**: Follow `ASSETS_SETUP.md` to add app icons
3. **Test Features**: Try all features with real data
4. **Build**: When ready, build for production using EAS

## Need Help?

- Check `README.md` for detailed documentation
- Review Expo docs: https://docs.expo.dev
- Check Supabase docs: https://supabase.com/docs

## Production Build

When you're ready to deploy:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

Follow the prompts to configure your build.

---

**That's it!** You now have a fully functional admin mobile app. 🎉
