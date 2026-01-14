import { Header } from "@/components/dashboard/header"
import { CreditManagement } from "@/components/credit/credit-management"
import { createClient } from "@/lib/supabase/server"
import { getUserStoreContext } from "@/lib/utils/store-context"
import { redirect } from "next/navigation"
import { PermissionGuard } from "@/components/dashboard/permission-guard"

export default async function CreditPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const storeContext = await getUserStoreContext(user.id)

  // Build customers query - filter by store based on permissions
  // Admin without store assignment can see all customers, others see only their store
  // Include store information for display
  let customersQuery = supabase
    .from("customers")
    .select(`
      *,
      stores:store_id (id, name)
    `)

  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    customersQuery = customersQuery.eq("store_id", storeContext.storeId)
  }

  const { data: customers } = await customersQuery.order("name")

  // Fetch all stores for display purposes
  const { data: allStores } = await supabase.from("stores").select("id, name").eq("is_active", true)

  return (
    <PermissionGuard feature="credit">
      <div>
        <Header title="Credit Management" />
        <div className="p-6">
          <CreditManagement 
            customers={customers || []} 
            canAccessAllStores={storeContext.canAccessAllStores}
            stores={allStores || []}
            userStoreId={storeContext.storeId}
          />
        </div>
      </div>
    </PermissionGuard>
  )
}
