import { createClient } from "@/lib/supabase/server"
import type { Currency } from "./currency"

// Server-side currency fetcher
export async function getDefaultCurrencyServer(): Promise<Currency> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("currencies").select("*").eq("is_default", true).single()

    if (error) {
      console.log("[v0] Server currency fetch error:", error.message)
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
      console.log("[v0] Server: No default currency found, using USD")
      return {
        id: "default",
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        exchange_rate: 1,
        is_default: true,
      }
    }

    console.log("[v0] Server loaded currency:", data.code, data.symbol)
    return data
  } catch (error) {
    console.error("[v0] Server currency fetch exception:", error)
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

