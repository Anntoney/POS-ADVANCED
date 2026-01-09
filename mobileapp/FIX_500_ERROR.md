# Fix: Development Server Error 500

## The Problem
A 500 error means Metro bundler failed to compile/bundle your app. This is usually caused by:
1. Path alias (`@/`) not resolving correctly
2. Missing or incorrect imports
3. Syntax errors in code
4. Environment variables not loading

## Quick Fixes

### Step 1: Check Metro Terminal for Exact Error

Look at the terminal where `npm start` is running. You should see the actual error message. Common errors:

- **"Cannot resolve module '@/lib/supabase'"** → Path alias issue
- **"Module not found"** → Missing dependency
- **Syntax errors** → Code issue

### Step 2: Try These Solutions

#### Solution A: Restart with Cleared Cache

```powershell
# Stop Metro (Ctrl+C)
cd D:\POS\POS-ADVANCED\mobileapp

# Clear everything
if (Test-Path .expo) { Remove-Item -Recurse -Force .expo }
if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }

# Restart
npm start -- --reset-cache
```

#### Solution B: Check Environment Variables

Make sure `.env` file exists and has correct values:

```powershell
cd D:\POS\POS-ADVANCED\mobileapp
type .env
```

Should show:
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

#### Solution C: Test Path Alias

If path alias `@/` is the issue, try using relative paths temporarily:

In `app/index.tsx`, change:
```tsx
const module = await import('@/lib/supabase');
```

To:
```tsx
const module = await import('../lib/supabase');
```

#### Solution D: Check for Syntax Errors

```powershell
cd D:\POS\POS-ADVANCED\mobileapp
npx tsc --noEmit
```

This will show TypeScript errors if any.

### Step 3: Check Metro Logs

In the Metro terminal, look for:
- Red error messages
- Stack traces
- "Bundling failed" messages

The error message will tell you exactly what's wrong.

## Common Error Messages and Fixes

### "Cannot find module '@/lib/supabase'"
**Fix:** The path alias isn't working. Try:
1. Restart Metro with `--reset-cache`
2. Or use relative imports: `../lib/supabase`

### "process.env.EXPO_PUBLIC_SUPABASE_URL is undefined"
**Fix:** Environment variables not loading:
1. Make sure `.env` file exists in `mobileapp/` directory
2. Restart Metro after creating/editing `.env`
3. Variables must start with `EXPO_PUBLIC_`

### "Module not found: Can't resolve 'expo-linking'"
**Fix:** Missing dependency:
```powershell
npm install expo-linking
npm start -- --reset-cache
```

### "SyntaxError: Unexpected token"
**Fix:** Code syntax error:
1. Check the file mentioned in the error
2. Look for missing brackets, quotes, etc.
3. Run `npx tsc --noEmit` to find errors

## Still Not Working?

1. **Share the exact error message** from Metro terminal
2. **Check Metro terminal output** - it shows the real error
3. **Try web version** to isolate the issue:
   ```powershell
   npm run web
   ```

## Quick Test: Minimal Version

To test if the setup works, temporarily simplify `app/index.tsx`:

```tsx
import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Test App</Text>
    </View>
  );
}
```

If this works, the issue is in the Supabase initialization or path aliases.
