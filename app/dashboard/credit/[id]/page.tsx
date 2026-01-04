import { Header } from "@/components/dashboard/header"
import { CustomerCreditDetail } from "@/components/credit/customer-credit-detail"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function CustomerCreditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch customer details
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single()

  if (!customer) {
    notFound()
  }

  // Fetch all sales for this customer (both credit and paid)
  const { data: sales } = await supabase
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

  // Fetch all payments for this customer
  const { data: payments } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("customer_id", id)
    .order("payment_date", { ascending: false })

  return (
    <div>
      <Header title={`Credit Details - ${customer.name}`} />
      <div className="p-6">
        <CustomerCreditDetail customer={customer} sales={sales || []} payments={payments || []} />
      </div>
    </div>
  )
}
