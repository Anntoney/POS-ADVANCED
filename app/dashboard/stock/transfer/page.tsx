import { Header } from "@/components/dashboard/header"
import { StockTransferForm } from "@/components/stock/stock-transfer-form"
import { StockTransferPageClient } from "@/components/stock/stock-transfer-page-client"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function StockTransferPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: stores }, { data: products }] = await Promise.all([
    supabase.from("stores").select("*").eq("is_active", true).order("name"),
    supabase
      .from("products")
      .select(
        `
      *,
      categories (name),
      units (short_name)
    `,
      )
      .eq("is_active", true)
      .order("name"),
  ])

  if (!stores || stores.length < 2) {
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

  return (
    <div>
      <Header title="Stock Transfer" />
      <div className="p-6 space-y-6">
        <StockTransferPageClient stores={stores || []} userId={user.id} />
        <StockTransferForm products={products || []} stores={stores || []} userId={user.id} />
      </div>
    </div>
  )
}
