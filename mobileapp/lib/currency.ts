import { supabase } from './supabase'

export type Currency = {
  id: string
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_default: boolean
}

let cachedCurrency: Currency | null = null
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getDefaultCurrency(): Promise<Currency> {
  // Return cached currency if still valid
  if (cachedCurrency && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedCurrency
  }

  try {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_default', true)
      .single()

    if (error || !data) {
      console.log('Currency fetch error, using USD:', error?.message)
      return {
        id: 'default',
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchange_rate: 1,
        is_default: true,
      }
    }

    cachedCurrency = data
    cacheTime = Date.now()
    console.log('Loaded currency:', data.code, data.symbol)
    return data
  } catch (error) {
    console.error('Currency fetch exception:', error)
    return {
      id: 'default',
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      exchange_rate: 1,
      is_default: true,
    }
  }
}

export function formatCurrency(amount: number, currency: Currency): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency.symbol}${formatted}`
}

export function clearCurrencyCache() {
  cachedCurrency = null
  cacheTime = 0
}
