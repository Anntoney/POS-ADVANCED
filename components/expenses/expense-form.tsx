"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Expense = {
  id: string
  expense_number: string
  category: string
  amount: number
  expense_date: string
  payment_method: string | null
  description: string | null
  receipt_url: string | null
}

export function ExpenseForm({ expense }: { expense?: Expense }) {
  const [category, setCategory] = useState(expense?.category || "")
  const [amount, setAmount] = useState(expense?.amount.toString() || "0")
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date ? new Date(expense.expense_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  )
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method || "cash")
  const [description, setDescription] = useState(expense?.description || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in")
      setIsLoading(false)
      return
    }

    if (!category || !amount || Number(amount) <= 0) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    try {
      const expenseData = {
        category,
        amount: Number.parseFloat(amount),
        expense_date: `${expenseDate}T00:00:00`,
        payment_method: paymentMethod || "cash",
        description: description || null,
      }

      // Get user's store_id
      const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.id).single()
      const storeId = profile?.store_id || null

      if (expense) {
        // Update existing expense
        const { error: updateError } = await supabase
          .from("expenses")
          .update({
            ...expenseData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", expense.id)

        if (updateError) throw updateError
        alert("Expense updated successfully!")
      } else {
        // Create new expense
        const expenseNumber = `EXP-${Date.now()}`
        const { error: insertError } = await supabase.from("expenses").insert({
          ...expenseData,
          expense_number: expenseNumber,
          store_id: storeId,
          created_by: user.id,
        })

        if (insertError) throw insertError
        alert("Expense created successfully!")
      }

      router.push("/dashboard/expenses")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const expenseCategories = [
    "Rent",
    "Utilities",
    "Salaries",
    "Office Supplies",
    "Marketing",
    "Transportation",
    "Maintenance",
    "Insurance",
    "Taxes",
    "Other",
  ]

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{expense ? "Edit Expense" : "Create New Expense"}</CardTitle>
        <CardDescription>
          {expense ? "Update the expense information below" : "Fill in the details to create a new expense"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expenseDate">Expense Date *</Label>
              <Input
                id="expenseDate"
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter expense description..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : expense ? "Update Expense" : "Create Expense"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
