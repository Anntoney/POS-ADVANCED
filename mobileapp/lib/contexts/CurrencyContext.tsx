import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
}

interface CurrencyContextType {
  currency: Currency | null;
  loading: boolean;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrency = async () => {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase URL not configured. Using default currency.');
        setCurrency({
          id: 'default',
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          exchange_rate: 1,
          is_default: true,
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_default', true)
        .single();

      if (error) {
        // Log detailed error information
        console.error('Supabase error fetching currency:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      if (data) {
        setCurrency(data);
        console.log('✅ Currency loaded successfully:', data.code);
      } else {
        // Fallback to USD if no default currency is set
        console.log('ℹ️ No default currency found, using USD');
        setCurrency({
          id: 'default',
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          exchange_rate: 1,
          is_default: true,
        });
      }
    } catch (error: any) {
      // Enhanced error logging
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || 'UNKNOWN';
      
      console.error('❌ Error fetching currency:', {
        message: errorMessage,
        code: errorCode,
        details: error?.details,
        type: error?.name || typeof error,
        fullError: error,
      });

      // Check for specific network errors
      if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
        console.error('🌐 Network error detected. Possible causes:');
        console.error('  1. Check internet connection');
        console.error('  2. Verify EXPO_PUBLIC_SUPABASE_URL is correct');
        console.error('  3. Ensure Supabase project is accessible');
        console.error('  4. Check Android network security configuration');
      }

      // Fallback to USD on error
      setCurrency({
        id: 'default',
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchange_rate: 1,
        is_default: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrency();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, loading, refreshCurrency: fetchCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
