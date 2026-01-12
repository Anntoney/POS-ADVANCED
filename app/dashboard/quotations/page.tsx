import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { QuotationsTable } from "@/components/quotations/quotations-table"
import { createClient } from "@/lib/supabase/server"
import { getUserStoreContext } from "@/lib/utils/store-context"
import { redirect } from "next/navigation"
import { PermissionGuard } from "@/components/dashboard/permission-guard"

export default async function QuotationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const storeContext = await getUserStoreContext(user.id)

  // Build quotations query - filter by store based on permissions
  // Admin without store assignment can see all quotations, others see only their store
  let quotationsQuery = supabase
    .from("quotations")
    .select(`
      *,
      customers:customer_id (id, name),
      stores:store_id (id, name)
    `)

  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    quotationsQuery = quotationsQuery.eq("store_id", storeContext.storeId)
  }

  const { data: quotations } = await quotationsQuery.order("created_at", { ascending: false })

  return (
    <PermissionGuard feature="quotations">
      <div>
        <Header title="Quotations" />
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Manage Quotations</h2>
              <p className="text-sm text-muted-foreground">
                {storeContext.canAccessAllStores
                  ? "Create and manage quotations for all stores"
                  : "Create and manage quotations for your store"}
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/quotations/new">
                <Plus className="mr-2 h-4 w-4" />
                New Quotation
              </Link>
            </Button>
          </div>
          <QuotationsTable quotations={quotations || []} canAccessAllStores={storeContext.canAccessAllStores} />
        </div>
      </div>
    </PermissionGuard>
  )
}
