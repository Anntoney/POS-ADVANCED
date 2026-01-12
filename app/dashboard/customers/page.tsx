import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CustomersTable } from "@/components/customers/customers-table"
import { createClient } from "@/lib/supabase/server"
import { getUserStoreContext } from "@/lib/utils/store-context"
import { redirect } from "next/navigation"

export default async function CustomersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const storeContext = await getUserStoreContext(user.id)

  // Build customers query - filter by store if user is not admin or has a store assigned
  let customersQuery = supabase.from("customers").select("*")

  // Filter by store: Admins without a store can see all, others see only their store
  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    customersQuery = customersQuery.eq("store_id", storeContext.storeId)
  }

  const { data: customers } = await customersQuery.order("created_at", { ascending: false })

  return (
    <div>
      <Header title="Customers" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Manage Customers</h2>
            <p className="text-sm text-muted-foreground">
              {storeContext.canAccessAllStores
                ? "Create and manage customer information for all stores"
                : `Manage customers for your store`}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>
        <CustomersTable customers={customers || []} />
      </div>
    </div>
  )
}
