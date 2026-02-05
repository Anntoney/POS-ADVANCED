# Install Updates - Quick Guide

## What's New

1. ✅ Dark Mode & Light Mode
2. ✅ Currency matching web application  
3. ✅ Show/Hide stock totals
4. ✅ Fixed returns table error

## Installation Steps

### Step 1: Stop the current server
Press `Ctrl+C` in your terminal if Expo is running.

### Step 2: Install new dependencies
```cmd
cd mobileapp
npm install --legacy-peer-deps
```

### Step 3: Start with cleared cache
```cmd
npx expo start --clear
```

### Step 4: Reload the app
- Shake your phone
- Tap "Reload"

## That's It!

The app now has:
- Dark mode toggle in Profile screen
- Currency from your database
- Stock totals with show/hide option
- Working returns screen

## Test the Features

### Test Dark Mode:
1. Open app
2. Go to Profile tab
3. Tap "Theme"
4. Select "Dark"
5. See all screens in dark mode!

### Test Currency:
1. Go to Stock tab
2. Prices should show your currency symbol (not just $)
3. Same currency as web application

### Test Stock Totals:
1. Go to Stock tab
2. Tap the eye icon next to search
3. See totals card appear/disappear
4. Close and reopen app - preference is saved!

### Test Returns:
1. Go to Returns tab
2. Should load without errors
3. Shows all sale returns

## Troubleshooting

### "Module not found: @react-native-async-storage"
Run:
```cmd
npm install @react-native-async-storage/async-storage@~2.1.0 --legacy-peer-deps
npx expo start --clear
```

### Theme not changing
- Make sure you reloaded the app after selecting theme
- Check Profile screen shows correct theme name

### Currency still showing $
- Check your database has a default currency set
- Web application should have currency configured
- App will fall back to USD if no currency found

### Returns still showing error
- Make sure you restarted Expo with --clear flag
- Check database has `sale_returns` table

## Need Help?

Check `UPDATES.md` for detailed information about all changes.

---

**Quick Commands:**
```cmd
# Install
npm install --legacy-peer-deps

# Start
npx expo start --clear

# If issues
npm install @react-native-async-storage/async-storage@~2.1.0 --legacy-peer-deps
npx expo start --clear
```
