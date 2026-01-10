import { Stack } from 'expo-router';
import { CurrencyProvider } from '@/lib/contexts/CurrencyContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
    </Stack>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
