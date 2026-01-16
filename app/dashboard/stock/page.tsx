import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { StockTable } from "@/components/stock/stock-table"
import { createClient } from "@/lib/supabase/server"
import { getUserStoreContext } from "@/lib/utils/store-context"
import { redirect } from "next/navigation"

export default async function StockPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  try {
  const storeContext = await getUserStoreContext(user.id)
  
    // Fetch all stores for the filter
    const { data: stores } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true)
      .order("name")

  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      <div className="flex-shrink-0">
      <Header title="Stock Management" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 space-y-4" suppressHydrationWarning>
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
          <StockTable 
            stores={stores || []}
            canAccessAllStores={storeContext.canAccessAllStores}
            userStoreId={storeContext.storeId}
          />
        </div>
      </div>
    </div>
  )
  } catch (error) {
    console.error("Error loading stock page:", error)
    redirect("/dashboard")
  }
}
