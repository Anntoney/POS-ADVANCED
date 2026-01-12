import { Header } from "@/components/dashboard/header"
import { StockTransferLogs } from "@/components/stock/stock-transfer-logs"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import { getUserStoreContext } from "@/lib/utils/store-context"

export default async function StockTransfersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const storeContext = await getUserStoreContext(user.id)

  return (
    <PermissionGuard feature="stock_transfer">
      <div>
        <Header title="Stock Transfer Logs" />
        <div className="p-6" suppressHydrationWarning>
          <StockTransferLogs 
            userId={user.id} 
            isAdmin={storeContext.isAdmin}
            userStoreId={storeContext.storeId}
            canAccessAllStores={storeContext.canAccessAllStores}
          />
        </div>
      </div>
    </PermissionGuard>
  )
}
