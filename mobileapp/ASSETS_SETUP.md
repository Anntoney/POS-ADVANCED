# Assets Setup Guide

This mobile app requires several image assets to be added before building for production.

## Required Assets

Create an `assets` folder in the `mobileapp` directory and add the following files:

### 1. App Icon
**File**: `assets/icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Purpose**: Main app icon shown on home screen

### 2. Splash Screen
**File**: `assets/splash.png`
- **Size**: 1284x2778 pixels (iPhone 13 Pro Max)
- **Format**: PNG
- **Purpose**: Loading screen when app starts
- **Background**: White (#FFFFFF) as configured in app.json

### 3. Adaptive Icon (Android)
**File**: `assets/adaptive-icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Purpose**: Android adaptive icon
- **Note**: Center 66% of the icon should contain the important content

### 4. Favicon (Web)
**File**: `assets/favicon.png`
- **Size**: 48x48 pixels
- **Format**: PNG
- **Purpose**: Browser tab icon when running on web

## Quick Setup

You can use the existing logo from the main project:

```bash
# From the mobileapp directory
mkdir -p assets

# Copy and resize the main project logo
# You'll need to manually resize these or use an image editor

# For now, you can use placeholder images:
# Download from https://via.placeholder.com/1024x1024.png
```

## Using Online Tools

Generate all required assets automatically:

1. **App Icon Generator**: https://www.appicon.co/
   - Upload a 1024x1024 image
   - Download iOS and Android icons

2. **Expo Asset Generator**: https://github.com/expo/expo-cli
   - Use `expo-cli` to generate assets
   - Run: `npx expo-cli generate-assets`

## Testing Without Assets

For development, the app will work without these assets. You'll see:
- Default Expo icon
- White splash screen
- No favicon

However, you **must** add proper assets before:
- Submitting to App Store
- Publishing to Google Play
- Sharing with users

## Asset Checklist

Before building for production:

- [ ] icon.png (1024x1024)
- [ ] splash.png (1284x2778)
- [ ] adaptive-icon.png (1024x1024)
- [ ] favicon.png (48x48)
- [ ] All images are optimized (compressed)
- [ ] Icons have transparent backgrounds
- [ ] Splash screen matches brand colors

## Updating app.json

If you change the splash screen background color, update `app.json`:

```json
{
  "expo": {
    "splash": {
      "backgroundColor": "#007AFF"  // Change this
    }
  }
}
```

## Brand Colors Reference

Current app colors:
- Primary Blue: `#007AFF`
- Success Green: `#4CAF50`
- Warning Orange: `#FF9800`
- Error Red: `#FF5252`
- Background: `#F5F5F5`

Use these colors when designing your app icon and splash screen for consistency.
