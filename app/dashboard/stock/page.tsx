import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { StockTable } from "@/components/stock/stock-table"
import { createClient } from "@/lib/supabase/server"
import { getUserStoreContext } from "@/lib/utils/store-context"

export default async function StockPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const storeContext = await getUserStoreContext(user.id)
  
  let productsQuery = supabase
    .from("products")
    .select(
      `
      *,
      categories (name),
      units (short_name)
    `,
    )

  // Filter by store if user is assigned to a store
  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    productsQuery = productsQuery.eq("store_id", storeContext.storeId)
  }

  const { data: products } = await productsQuery.order("stock_quantity", { ascending: true })

  return (
    <div>
      <Header title="Stock Management" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Inventory Overview</h2>
            <p className="text-sm text-muted-foreground">Monitor and adjust stock levels</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/stock/transfers">
                Transfer Logs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/stock/transfer">
                Transfer Stock
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/stock/adjust">
                <Plus className="mr-2 h-4 w-4" />
                Stock Adjustment
              </Link>
            </Button>
          </div>
        </div>
        <StockTable products={products || []} />
      </div>
    </div>
  )
}
