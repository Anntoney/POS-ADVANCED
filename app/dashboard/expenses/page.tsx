import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { createClient } from "@/lib/supabase/server"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import { getUserStoreContext } from "@/lib/utils/store-context"

export default async function ExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const storeContext = await getUserStoreContext(user.id)

  let expensesQuery = supabase.from("expenses").select("*").order("expense_date", { ascending: false })

  // Filter by store if user is assigned to a store
  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    expensesQuery = expensesQuery.eq("store_id", storeContext.storeId)
  }

  const { data: expenses } = await expensesQuery

  return (
    <PermissionGuard feature="expenses">
      <div>
        <Header title="Expenses" />
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Manage Expenses</h2>
              <p className="text-sm text-muted-foreground">Track and manage business expenses</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
          </div>
          <ExpensesTable expenses={expenses || []} />
        </div>
      </div>
    </PermissionGuard>
  )
}
