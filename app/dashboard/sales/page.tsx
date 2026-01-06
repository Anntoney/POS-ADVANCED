import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { SalesTable } from "@/components/sales/sales-table"
import { createClient } from "@/lib/supabase/server"
import { getUserStoreContext } from "@/lib/utils/store-context"

export default async function SalesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const storeContext = await getUserStoreContext(user.id)
  
  let salesQuery = supabase
    .from("sales")
    .select(`
      *,
      customers (name)
    `)

  // Filter by store if user is assigned to a store
  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    salesQuery = salesQuery.eq("store_id", storeContext.storeId)
  }

  const { data: sales } = await salesQuery.order("created_at", { ascending: false })

  return (
    <div>
      <Header title="Sales" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Sales Management</h2>
            <p className="text-sm text-muted-foreground">View and manage all sales transactions</p>
          </div>
          <Button asChild>
            <Link href="/pos">
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Link>
          </Button>
        </div>
        <SalesTable sales={sales || []} />
      </div>
    </div>
  )
}
