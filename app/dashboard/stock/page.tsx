import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { StockTable } from "@/components/stock/stock-table"
import { createClient } from "@/lib/supabase/server"

export default async function StockPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (name),
      units (short_name)
    `,
    )
    .order("stock_quantity", { ascending: true })

  return (
    <div>
      <Header title="Stock Management" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Inventory Overview</h2>
            <p className="text-sm text-muted-foreground">Monitor and adjust stock levels</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/stock/adjust">
              <Plus className="mr-2 h-4 w-4" />
              Stock Adjustment
            </Link>
          </Button>
        </div>
        <StockTable products={products || []} />
      </div>
    </div>
  )
}
