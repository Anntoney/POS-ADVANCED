import { Header } from "@/components/dashboard/header"
import { POSInterface } from "@/components/pos/pos-interface"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import { getUserStoreContext } from "@/lib/utils/store-context"

export default async function POSPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const storeContext = await getUserStoreContext(user.id)

  let productsQuery = supabase
    .from("products")
    .select(`
      *,
      categories (name),
      units (short_name)
    `)
    .eq("is_active", true)

  let customersQuery = supabase.from("customers").select("id, name, email, balance, credit_limit")

  // Filter by store if user is assigned to a store
  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    productsQuery = productsQuery.eq("store_id", storeContext.storeId)
    customersQuery = customersQuery.eq("store_id", storeContext.storeId)
  }

  const [{ data: products }, { data: customers }] = await Promise.all([
    productsQuery.order("name"),
    customersQuery.order("name"),
  ])

  return (
    <PermissionGuard feature="pos">
      <div className="min-h-screen flex flex-col">
        <Header title="Point of Sale" showMenu />
        <div className="flex-1 overflow-y-auto">
          <POSInterface products={products || []} customers={customers || []} userId={user.id} />
        </div>
      </div>
    </PermissionGuard>
  )
}
