import { Header } from "@/components/dashboard/header"
import { ReturnsTable } from "@/components/returns/returns-table"
import { ReturnForm } from "@/components/returns/return-form"
import { createClient } from "@/lib/supabase/server"

export default async function ReturnsPage() {
  const supabase = await createClient()
  const { data: returns } = await supabase
    .from("sale_returns")
    .select(`
      *,
      sales (
        sale_number,
        customers (name)
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div>
      <Header title="Returns" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Returns Management</h2>
            <p className="text-sm text-muted-foreground">Process sale returns and manage refunds</p>
          </div>
          <ReturnForm />
        </div>
        <ReturnsTable returns={returns || []} />
      </div>
    </div>
  )
}
