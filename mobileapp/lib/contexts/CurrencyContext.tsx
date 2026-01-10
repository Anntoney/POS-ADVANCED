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
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_default', true)
        .single();

      if (error) throw error;

      if (data) {
        setCurrency(data);
      } else {
        // Fallback to USD if no default currency is set
        setCurrency({
          id: 'default',
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          exchange_rate: 1,
          is_default: true,
        });
      }
    } catch (error) {
      console.error('Error fetching currency:', error);
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
