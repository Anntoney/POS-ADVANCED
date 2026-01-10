"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type Expense = {
  id: string
  expense_number: string
  category: string
  amount: number
  expense_date: string
  payment_method: string | null
  description: string | null
}

export function ExpensesTable({ expenses }: { expenses: Expense[] }) {
  const router = useRouter()
  const [currency, setCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    const supabase = createClient()
    const { error } = await supabase.from("expenses").delete().eq("id", id)

    if (error) {
      alert("Error deleting expense: " + error.message)
    } else {
      router.refresh()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getPaymentMethodBadge = (method: string | null) => {
    const methodMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      cash: { label: "Cash", variant: "default" },
      mobile_money: { label: "Mobile Money", variant: "secondary" },
      bank_transfer: { label: "Bank Transfer", variant: "outline" },
    }
    const methodData = methodMap[method || "cash"] || { label: method || "Cash", variant: "default" as const }
    return <Badge variant={methodData.variant}>{methodData.label}</Badge>
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No expenses found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/expenses/new">Create your first expense</Link>
        </Button>
      </div>
    )
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense #</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.expense_number}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{formatDate(expense.expense_date)}</TableCell>
                <TableCell>{getPaymentMethodBadge(expense.payment_method)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {currency ? formatCurrency(Number(expense.amount), currency) : `$${Number(expense.amount).toFixed(2)}`}
                </TableCell>
                <TableCell className="max-w-xs truncate">{expense.description || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/dashboard/expenses/${expense.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <div className="text-lg font-semibold">
          Total Expenses:{" "}
          {currency ? formatCurrency(totalExpenses, currency) : `$${totalExpenses.toFixed(2)}`}
        </div>
      </div>
    </div>
  )
}
