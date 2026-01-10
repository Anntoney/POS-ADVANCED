import { Header } from "@/components/dashboard/header"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { PermissionGuard } from "@/components/dashboard/permission-guard"

export default function NewExpensePage() {
  return (
    <PermissionGuard feature="expenses">
      <div>
        <Header title="New Expense" />
        <div className="p-6">
          <ExpenseForm />
        </div>
      </div>
    </PermissionGuard>
  )
}
