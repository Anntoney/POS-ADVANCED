import { Header } from "@/components/dashboard/header"
import { QuotationForm } from "@/components/quotations/quotation-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import { getUserStoreContext } from "@/lib/utils/store-context"

export default async function NewQuotationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const storeContext = await getUserStoreContext(user.id)

  // Fetch products and customers for the quotation form
  let productsQuery = supabase
    .from("products")
    .select("id, name, sku, selling_price, cost_price, tax_rate, stock_quantity")
    .eq("is_active", true)

  let customersQuery = supabase.from("customers").select("id, name")

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
    <PermissionGuard feature="quotations">
      <div>
        <Header title="New Quotation" />
        <div className="p-6">
          <QuotationForm products={products || []} customers={customers || []} />
        </div>
      </div>
    </PermissionGuard>
  )
}
