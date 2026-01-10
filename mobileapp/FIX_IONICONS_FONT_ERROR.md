# Fix Ionicons Font Error

If you're getting the error: "font family 'ionicons' is not a system font and has not been loaded through expo-font", follow these steps:

## Solution 1: Clear Metro Bundler Cache (Most Common Fix)

1. Stop the development server (Ctrl+C)
2. Clear the cache and restart:
   ```powershell
   cd mobileapp
   npm run start:clear
   ```

   Or manually:
   ```powershell
   cd mobileapp
   npx expo start --clear
   ```

## Solution 2: Clear All Caches

1. Stop the development server
2. Clear watchman cache (if installed):
   ```powershell
   watchman watch-del-all
   ```
3. Delete node_modules and reinstall:
   ```powershell
   cd mobileapp
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   npm start
   ```

## Solution 3: Check for Conflicts

The app uses `@expo/vector-icons` which doesn't require font loading. If you're seeing this error:

1. Make sure you're not importing from `react-native-vector-icons` anywhere
2. The app should use `@expo/vector-icons` only (which is already configured)

## Why This Happens

- `@expo/vector-icons` handles fonts automatically and doesn't require manual font loading
- The error usually occurs due to Metro bundler cache issues
- Sometimes occurs after updating dependencies

## If Error Persists

If the error still persists after clearing cache:

1. Close all terminal windows
2. Close the Expo Go app completely (if using it)
3. Restart your computer
4. Try again with `npm run start:clear`
