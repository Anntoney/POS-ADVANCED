import { Header } from "@/components/dashboard/header"
import { StockTransferForm } from "@/components/stock/stock-transfer-form"
import { StockTransferPageClient } from "@/components/stock/stock-transfer-page-client"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import { getUserStoreContext } from "@/lib/utils/store-context"

export default async function StockTransferPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const storeContext = await getUserStoreContext(user.id)

  // Fetch ALL active stores to check if we have at least 2
  const { data: allActiveStores } = await supabase
    .from("stores")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (!allActiveStores || allActiveStores.length < 2) {
    return (
      <div>
        <Header title="Stock Transfer" />
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">You need at least 2 active stores to transfer stock between them.</p>
          </div>
        </div>
      </div>
    )
  }

  // Fetch products - filter by user's store if not admin
  let productsQuery = supabase
    .from("products")
    .select(
      `
      *,
      categories (name),
      units (short_name)
    `,
    )
    .eq("is_active", true)
  
  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    productsQuery = productsQuery.eq("store_id", storeContext.storeId)
  }
  
  const { data: products } = await productsQuery.order("name")

  return (
    <PermissionGuard feature="stock_transfer">
      <div>
        <Header title="Stock Transfer" />
        <div className="p-6 space-y-6">
          <StockTransferPageClient stores={allActiveStores || []} userId={user.id} />
          <StockTransferForm 
            products={products || []} 
            stores={allActiveStores || []} 
            userId={user.id}
            userStoreId={storeContext.storeId}
            canAccessAllStores={storeContext.canAccessAllStores}
          />
        </div>
      </div>
    </PermissionGuard>
  )
}
