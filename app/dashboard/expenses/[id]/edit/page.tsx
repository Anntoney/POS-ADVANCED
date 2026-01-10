import { Header } from "@/components/dashboard/header"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { createClient } from "@/lib/supabase/server"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import { notFound } from "next/navigation"

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: expense } = await supabase.from("expenses").select("*").eq("id", id).single()

  if (!expense) {
    notFound()
  }

  return (
    <PermissionGuard feature="expenses">
      <div>
        <Header title="Edit Expense" />
        <div className="p-6">
          <ExpenseForm expense={expense} />
        </div>
      </div>
    </PermissionGuard>
  )
}
