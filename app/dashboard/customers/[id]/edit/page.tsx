import { Header } from "@/components/dashboard/header"
import { CustomerForm } from "@/components/customers/customer-form"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single()

  if (!customer) {
    notFound()
  }

  return (
    <div>
      <Header title="Edit Customer" />
      <div className="p-6">
        <CustomerForm customer={customer} />
      </div>
    </div>
  )
}
