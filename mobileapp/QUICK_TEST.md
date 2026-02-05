# Quick Test Guide

## 🚀 Start the App

```cmd
cd mobileapp
npx expo start --clear
```

Scan QR code and open in Expo Go.

## ✅ Quick Tests (2 minutes)

### Test 1: Dark Mode (30 seconds)
1. Open app
2. Go to **Profile** tab
3. Tap **Theme**
4. Select **Dark**
5. ✅ Check: All screens should be dark (including tab bar and header)

### Test 2: Currency (30 seconds)
1. Go to **Sales** tab
2. ✅ Check: Amounts show your currency symbol (not just $)
3. Go to **Debts** tab
4. ✅ Check: Amounts show your currency symbol
5. Go to **Stock** tab
6. ✅ Check: Prices show your currency symbol

### Test 3: Navigation (30 seconds)
1. Look at bottom tab bar
2. ✅ Check: Only 4 tabs visible:
   - Stock (cube icon)
   - Sales (cash icon)
   - Debts (card icon)
   - Profile (person icon)
3. ✅ Check: NO Returns tab

### Test 4: Theme Persistence (30 seconds)
1. Set theme to Dark
2. Close app completely
3. Reopen app
4. ✅ Check: Still in dark mode

## 🎨 Visual Checklist

### In Dark Mode, you should see:
- ⬛ Dark background everywhere
- ⬛ Dark tab bar at bottom
- ⬛ Dark header at top
- ⚪ White text
- 🔵 Blue accent colors

### In Light Mode, you should see:
- ⬜ Light gray background
- ⬜ White cards
- ⬛ Black text
- 🔵 Blue accent colors

## 💰 Currency Examples

If your database uses:
- **KES** (Kenyan Shilling): Should show "KSh 1,000.00"
- **USD** (US Dollar): Should show "$1,000.00"
- **EUR** (Euro): Should show "€1,000.00"
- **GBP** (British Pound): Should show "£1,000.00"

## 🐛 Common Issues

### Currency still shows $
**Fix:** Make sure your web application has a default currency set in the database.

### Dark mode not working
**Fix:** 
1. Stop Expo (Ctrl+C)
2. Run: `npx expo start --clear`
3. Reload app

### Returns tab still visible
**Fix:**
1. Stop Expo (Ctrl+C)
2. Run: `npx expo start --clear`
3. Reload app

## ✨ All Features Working?

If all tests pass, you're good to go! 🎉

The app now has:
- ✅ System-wide dark mode
- ✅ Currency from database
- ✅ Clean 4-tab interface
- ✅ No Returns module

---

**Total test time:** ~2 minutes  
**Expected result:** All ✅ checks should pass
