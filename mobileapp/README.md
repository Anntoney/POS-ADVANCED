# Admin Mobile App

A React Native mobile application for administrators to manage inventory, sales, debts, and returns on the go.

## Features

### 1. Stock Management
- View all products with current stock levels
- Search products by name, SKU, or barcode
- Add stock to products
- Deduct stock from products
- Update product prices
- Low stock indicators
- Stock adjustment tracking with reasons

### 2. Sales Tracking
- View sales by date range
- Filter sales between start and end dates
- See total sales amount and transaction count
- View payment status (Paid, Partial, Pending)
- Customer information for each sale
- Payment method details
- Outstanding balance tracking

### 3. Customer Debts
- View all customers with outstanding balances
- Total debt summary
- Customer contact information
- Individual debt amounts
- Quick access to customer details

### 4. Returns Management
- View all product returns
- Return reference to original sale
- Customer information
- Refund method tracking
- Return notes and reasons
- Total returns summary
- Detailed breakdown (subtotal, tax, total)

### 5. Profile & Settings
- User profile information
- App version and status
- Quick actions (sync, settings, help)
- Secure logout

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with secure storage
- **UI**: React Native components with custom styling
- **Icons**: Ionicons from @expo/vector-icons
- **Date Handling**: date-fns

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Expo Go app on physical device (optional)

## Installation

1. Navigate to the mobile app directory:
```bash
cd mobileapp
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
The `.env` file is already configured with your Supabase credentials.

## Running the App

### Start the development server:
```bash
npm start
```

### Run on specific platforms:

**iOS Simulator (Mac only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

**Web Browser:**
```bash
npm run web
```

**Physical Device:**
1. Install Expo Go from App Store or Play Store
2. Scan the QR code shown in terminal
3. App will load on your device

## Project Structure

```
mobileapp/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx       # Auth layout
│   │   └── login.tsx          # Login screen
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tab navigation layout
│   │   ├── index.tsx          # Stock management
│   │   ├── sales.tsx          # Sales tracking
│   │   ├── debts.tsx          # Customer debts
│   │   ├── returns.tsx        # Returns management
│   │   └── profile.tsx        # User profile
│   ├── _layout.tsx            # Root layout
│   └── index.tsx              # Entry point
├── lib/
│   ├── supabase.ts            # Supabase client config
│   └── types.ts               # TypeScript types
├── .env                       # Environment variables
├── app.json                   # Expo configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

## Authentication

- Only users with **admin** role can access the app
- Login credentials are validated against Supabase Auth
- Sessions are stored securely using Expo SecureStore
- Auto-logout on session expiry

## Database Tables Used

- `products` - Product inventory
- `stock_adjustments` - Stock change history
- `sales` - Sales transactions
- `customers` - Customer information
- `returns` - Product returns
- `profiles` - User profiles

## Security

- Environment variables for sensitive data
- Secure session storage
- Row-level security on Supabase
- Admin-only access control
- Automatic session refresh

## Customization

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### Change Colors
Update styles in each screen file. Main colors used:
- Primary: `#007AFF` (iOS blue)
- Success: `#4CAF50` (green)
- Warning: `#FF9800` (orange)
- Error: `#FF5252` (red)

### Add App Icons
Replace placeholder images in `assets/` folder:
- `icon.png` - App icon (1024x1024)
- `splash.png` - Splash screen
- `adaptive-icon.png` - Android adaptive icon

## Building for Production

### iOS (requires Mac):
```bash
expo build:ios
```

### Android:
```bash
expo build:android
```

### Using EAS Build (recommended):
```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## Troubleshooting

**App won't start:**
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Authentication issues:**
- Verify Supabase credentials in `.env`
- Check user role is set to "admin"

**Date picker not showing:**
- Ensure `@react-native-community/datetimepicker` is installed
- Rebuild the app after installing

## Support

For issues or questions:
1. Check the main system documentation
2. Review Expo documentation: https://docs.expo.dev
3. Check Supabase docs: https://supabase.com/docs

## License

This mobile app is part of the main inventory management system.
