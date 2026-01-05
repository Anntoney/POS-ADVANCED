import { Header } from "@/components/dashboard/header"
import { CreditManagement } from "@/components/credit/credit-management"
import { createClient } from "@/lib/supabase/server"

export default async function CreditPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase.from("customers").select("*").order("name")

  return (
    <div>
      <Header title="Credit Management" />
      <div className="p-6">
        <CreditManagement customers={customers || []} />
      </div>
    </div>
  )
}
