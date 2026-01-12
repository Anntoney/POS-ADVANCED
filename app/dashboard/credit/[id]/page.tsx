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

  // Fetch all sales for this customer - we'll filter for credit sales in the component
  // Since we've already verified the customer belongs to the cashier's store,
  // we can fetch all sales for this customer without additional store filtering
  const { data: sales, error: salesError } = await supabase
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
    .order("sale_date", { ascending: false })

  if (salesError) {
    console.error("Error fetching sales:", salesError)
  }

  // Ensure sale_items are always loaded - fetch separately if needed
  let salesWithItems = (sales || []).map((sale: any) => ({
    ...sale,
    sale_items: sale.sale_items || []
  }))
  
  // Check if any sales are missing sale_items and fetch them separately
    const salesWithoutItems = salesWithItems.filter((s: any) => !s.sale_items || s.sale_items.length === 0)
    
    if (salesWithoutItems.length > 0) {
      const saleIds = salesWithoutItems.map((s: any) => s.id)
      const { data: items, error: itemsError } = await supabase
        .from("sale_items")
        .select("*")
        .in("sale_id", saleIds)
      
    if (itemsError) {
      console.error("Error fetching sale_items:", itemsError)
    }
    
      // Merge sale_items back into sales
    if (items && items.length > 0) {
        salesWithItems = salesWithItems.map((sale: any) => {
          if (!sale.sale_items || sale.sale_items.length === 0) {
          const saleItems = items.filter((item: any) => item.sale_id === sale.id)
            return {
              ...sale,
            sale_items: saleItems
            }
          }
          return sale
        })
    }
  }

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
          <CustomerCreditDetail customer={customer} sales={salesWithItems} payments={payments || []} />
        </div>
      </div>
    </PermissionGuard>
  )
}
