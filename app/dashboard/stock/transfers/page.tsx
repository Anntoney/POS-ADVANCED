import { Header } from "@/components/dashboard/header"
import { StockTransferLogs } from "@/components/stock/stock-transfer-logs"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PermissionGuard } from "@/components/dashboard/permission-guard"

export default async function StockTransfersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const isAdmin = profile?.role === "admin"

  return (
    <PermissionGuard feature="stock_transfer">
      <div>
        <Header title="Stock Transfer Logs" />
        <div className="p-6">
          <StockTransferLogs userId={user.id} isAdmin={isAdmin || false} />
        </div>
      </div>
    </PermissionGuard>
  )
}
