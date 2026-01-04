import { Header } from "@/components/dashboard/header"
import { StockAdjustmentForm } from "@/components/stock/stock-adjustment-form"
import { createClient } from "@/lib/supabase/server"

export default async function StockAdjustPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku, stock_quantity, units (short_name)")
    .eq("is_active", true)
    .order("name")

  return (
    <div>
      <Header title="Stock Adjustment" />
      <div className="p-6">
        <StockAdjustmentForm products={products || []} />
      </div>
    </div>
  )
}
