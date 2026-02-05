# Quick Setup for Windows

## Step 1: Install Dependencies

Open Command Prompt in the `mobileapp` folder and run:

```cmd
npm install --legacy-peer-deps
```

**This will take 2-5 minutes. Be patient!**

## Step 2: Start the App

After installation completes:

```cmd
npx expo start --clear
```

## Step 3: Update Expo Go App

You have two options:

### Option A: Update Expo Go (Recommended)
1. Open Play Store or App Store on your phone
2. Search for "Expo Go"
3. Update to the latest version (SDK 54)
4. Scan the QR code again

### Option B: Downgrade Project to SDK 51
If you can't update Expo Go, run:
```cmd
npm install expo@~51.0.0 --legacy-peer-deps
npx expo start --clear
```

## Troubleshooting

### "npm install" is stuck
- Press Ctrl+C to cancel
- Delete `node_modules` folder
- Run: `npm install --legacy-peer-deps` again

### "Asset not found" error
- This is normal for development
- The app will use default Expo icons
- You can add custom icons later

### Still connecting to wrong Supabase project
- Make sure you ran `npx expo start --clear` (with --clear flag)
- Reload the app on your device (shake phone → Reload)
- Check terminal for "🔧 Supabase Configuration" message

## What You Should See

After starting, the terminal should show:
```
🔧 Supabase Configuration:
URL: https://soqxolezaulotushohjd.supabase.co
Project Ref: soqxolezaulotushohjd
```

If the Project Ref is correct, you're good to go!

## Next Steps

1. Scan QR code with Expo Go
2. Login with your admin credentials
3. Start managing your inventory!
