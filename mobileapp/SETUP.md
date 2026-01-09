# Quick Setup Guide

## 1. Install Dependencies

```bash
cd mobileapp
npm install
```

## 2. Configure Environment Variables

Create a `.env` file in the `mobileapp` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project settings.

## 3. Start Development Server

```bash
npm start
```

## 4. Run on Device

### Option A: Using Expo Go (Recommended for Development)
1. Install Expo Go on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Scan the QR code shown in the terminal
3. The app will load on your device

### Option B: Using Simulator/Emulator
- iOS Simulator: Press `i` in the terminal
- Android Emulator: Press `a` in the terminal

## 5. Login

Use an admin account from your Supabase database. The app will only allow users with the `admin` role to access.

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created a `.env` file with the correct variable names
- Restart the Expo server after creating/updating `.env`

### "Access Denied" on login
- Ensure the user has `role: 'admin'` in the `profiles` table
- Check that the user exists in Supabase Auth

### Build errors
- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Next Steps

- Customize the app icon and splash screen in `app.json`
- Add more features as needed
- Build for production when ready
