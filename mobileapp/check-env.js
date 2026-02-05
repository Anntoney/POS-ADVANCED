#!/usr/bin/env node

/**
 * Quick script to verify environment variables are loaded correctly
 * Run: node check-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Supabase Configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('📝 Create a .env file in the mobileapp directory with:');
  console.log('   EXPO_PUBLIC_SUPABASE_URL=your_url');
  console.log('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key\n');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

console.log('✅ .env file found\n');
console.log('📋 Environment Variables:\n');

let hasUrl = false;
let hasKey = false;

lines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  
  if (key.trim() === 'EXPO_PUBLIC_SUPABASE_URL') {
    hasUrl = true;
    console.log(`✓ ${key.trim()}`);
    console.log(`  Value: ${value}`);
    
    // Extract project ref
    const match = value.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (match) {
      console.log(`  Project Ref: ${match[1]}`);
    }
    console.log();
  } else if (key.trim() === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') {
    hasKey = true;
    console.log(`✓ ${key.trim()}`);
    console.log(`  Value: ${value.substring(0, 30)}...`);
    console.log(`  Length: ${value.length} characters`);
    console.log();
  }
});

// Validation
console.log('🔐 Validation:\n');

if (!hasUrl) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL is missing!');
} else {
  console.log('✅ EXPO_PUBLIC_SUPABASE_URL is set');
}

if (!hasKey) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is missing!');
} else {
  console.log('✅ EXPO_PUBLIC_SUPABASE_ANON_KEY is set');
}

console.log('\n📝 Next Steps:\n');
console.log('1. Stop your Expo dev server (Ctrl+C)');
console.log('2. Clear cache: npx expo start --clear');
console.log('3. Reload the app on your device');
console.log('4. Check the terminal logs for "🔧 Supabase Configuration"');
console.log('5. Verify the Project Ref matches your expected project\n');

if (hasUrl && hasKey) {
  console.log('✨ Configuration looks good!\n');
} else {
  console.log('⚠️  Please fix the missing variables and try again.\n');
  process.exit(1);
}
