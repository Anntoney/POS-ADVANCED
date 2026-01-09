# POS Admin Mobile App

A React Native mobile application built with Expo for administrators to manage the POS system on the go.

## Features

- **Dashboard**: Real-time overview of key business metrics
- **Products Management**: View and manage products with search functionality
- **Stock Management**: Monitor stock levels with low stock alerts
- **Sales Tracking**: View recent sales and revenue statistics
- **Settings**: User profile and system settings
- **Authentication**: Secure login with admin-only access

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for development)

## Setup

1. **Install dependencies:**
   ```bash
   cd mobileapp
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on your device:**
   - Scan the QR code with Expo Go (iOS) or Camera app (Android)
   - Or press `i` for iOS simulator, `a` for Android emulator

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

Or use EAS Build (recommended):
```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## Project Structure

```
mobileapp/
├── app/
│   ├── (tabs)/          # Tab navigation screens
│   │   ├── dashboard.tsx
│   │   ├── products.tsx
│   │   ├── stock.tsx
│   │   ├── sales.tsx
│   │   └── settings.tsx
│   ├── auth/
│   │   └── login.tsx    # Login screen
│   └── _layout.tsx       # Root layout
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Utility functions
├── package.json
├── app.json             # Expo configuration
└── tsconfig.json        # TypeScript configuration
```

## Key Technologies

- **Expo**: React Native framework
- **Expo Router**: File-based routing
- **Supabase**: Backend and authentication
- **TypeScript**: Type safety
- **React Navigation**: Navigation library

## Admin Access

This app is restricted to users with the `admin` role. Non-admin users will be automatically logged out upon login attempt.

## Features in Detail

### Dashboard
- Total revenue overview
- Product count
- Customer count
- Sales count
- Low stock alerts

### Products
- Search functionality
- Product details (price, stock, SKU)
- Active/inactive status
- Low stock indicators

### Stock
- Filter by stock status (All, Low Stock, Out of Stock)
- Visual stock level indicators
- Stock quantity tracking

### Sales
- Recent sales list
- Payment status indicators
- Payment method display
- Revenue summary

### Settings
- User profile display
- User management (coming soon)
- Store management (coming soon)
- Reports (coming soon)

## Troubleshooting

### Authentication Issues
- Ensure your Supabase credentials are correct
- Check that RLS policies allow admin access
- Verify the user has admin role in the profiles table

### Build Issues
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## License

Private - Internal use only
