import { createClient } from "@/lib/supabase/client"

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

// Client-side currency fetcher with caching
export async function getDefaultCurrency(): Promise<Currency> {
  // Return cached currency if still valid
  if (cachedCurrency && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedCurrency
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("currencies").select("*").eq("is_default", true).single()

    if (error) {
      console.log("[v0] Currency fetch error:", error.message)
      // Return default USD if no currency is set
      return {
        id: "default",
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        exchange_rate: 1,
        is_default: true,
      }
    }

    if (!data) {
      console.log("[v0] No default currency found, using USD")
      return {
        id: "default",
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        exchange_rate: 1,
        is_default: true,
      }
    }

    cachedCurrency = data
    cacheTime = Date.now()
    console.log("[v0] Loaded currency:", data.code, data.symbol)
    return data
  } catch (error) {
    console.error("[v0] Currency fetch exception:", error)
    // Return default USD on any error
    return {
      id: "default",
      code: "USD",
      name: "US Dollar",
      symbol: "$",
      exchange_rate: 1,
      is_default: true,
    }
  }
}

// Format amount with currency symbol and comma thousand separators
export function formatCurrency(amount: number, currency: Currency): string {
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency.symbol}${formatted}`
}

// Clear cache when currency changes
export function clearCurrencyCache() {
  cachedCurrency = null
  cacheTime = 0
}
