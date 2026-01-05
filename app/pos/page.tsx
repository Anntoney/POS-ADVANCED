import { Header } from "@/components/dashboard/header"
import { POSInterface } from "@/components/pos/pos-interface"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PermissionGuard } from "@/components/dashboard/permission-guard"

export default async function POSPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase
      .from("products")
      .select(`
        *,
        categories (name),
        units (short_name)
      `)
      .eq("is_active", true)
      .order("name"),
    supabase.from("customers").select("id, name, email, balance, credit_limit").order("name"),
  ])

  return (
    <PermissionGuard feature="pos">
      <div className="h-screen flex flex-col">
        <Header title="Point of Sale" showMenu />
        <div className="flex-1 overflow-hidden">
          <POSInterface products={products || []} customers={customers || []} userId={user.id} />
        </div>
      </div>
    </PermissionGuard>
  )
}
