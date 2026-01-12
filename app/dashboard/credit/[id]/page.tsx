import { Header } from "@/components/dashboard/header"
import { CustomerCreditDetail } from "@/components/credit/customer-credit-detail"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { getUserStoreContext } from "@/lib/utils/store-context"
import { PermissionGuard } from "@/components/dashboard/permission-guard"

export default async function CustomerCreditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const storeContext = await getUserStoreContext(user.id)

  // Fetch customer details
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single()

  if (!customer) {
    notFound()
  }

  // Check if user has permission to view this customer's credit
  // Admin without store can see all, others can only see customers from their store
  if (!storeContext.canAccessAllStores && customer.store_id !== storeContext.storeId) {
    notFound() // Return 404 if trying to access customer from another store
  }

  // Fetch all sales for this customer (both credit and paid) - filter by store if needed
  let salesQuery = supabase
    .from("sales")
    .select(`
      *,
      sale_items (
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        tax_rate,
        tax_amount,
        discount_amount,
        total_amount
      )
    `)
    .eq("customer_id", id)

  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    salesQuery = salesQuery.eq("store_id", storeContext.storeId)
  }

  const { data: sales } = await salesQuery.order("sale_date", { ascending: false })

  // Fetch all payments for this customer
  // Payments are linked to customers, so we get them directly
  const { data: payments } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("customer_id", id)
    .order("payment_date", { ascending: false })

  return (
    <PermissionGuard feature="credit">
      <div>
        <Header title={`Credit Details - ${customer.name}`} />
        <div className="p-6">
          <CustomerCreditDetail customer={customer} sales={sales || []} payments={payments || []} />
        </div>
      </div>
    </PermissionGuard>
  )
}
