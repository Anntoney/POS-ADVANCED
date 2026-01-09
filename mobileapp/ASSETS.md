# Assets Required

The following assets are referenced in `app.json` and need to be added to the `mobileapp/assets/` directory:

## Required Assets

1. **icon.png** (1024x1024)
   - App icon for iOS and Android
   - Should be a square image with no transparency

2. **splash.png** (1284x2778 recommended)
   - Splash screen image
   - Will be displayed while the app loads

3. **adaptive-icon.png** (1024x1024)
   - Android adaptive icon foreground
   - Should be centered in a square canvas

4. **favicon.png** (48x48)
   - Web favicon (optional, for web builds)

## Creating Assets

You can use online tools or design software to create these assets:

- **Online Tools:**
  - [App Icon Generator](https://www.appicon.co/)
  - [Expo Asset Generator](https://docs.expo.dev/guides/app-icons/)

- **Design Software:**
  - Figma
  - Adobe Illustrator
  - Sketch

## Temporary Solution

For development, you can use placeholder images or Expo will use default icons. The app will work without these assets, but you should add proper branding before production builds.

## Asset Guidelines

- Use high-resolution images (at least 2x the required size)
- Keep file sizes reasonable (< 1MB per asset)
- Use PNG format for transparency support
- Follow platform-specific guidelines:
  - [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
  - [Android Material Design](https://material.io/design)
