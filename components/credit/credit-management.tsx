"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreditCard, DollarSign, Eye } from "lucide-react"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"
import type { Customer } from "@/lib/types/database"

type CustomerWithStore = Customer & {
  stores?: { id: string; name: string } | null
}

type Store = {
  id: string
  name: string
}

export function CreditManagement({ 
  customers, 
  canAccessAllStores = false,
  stores = [],
  userStoreId = null
}: { 
  customers: CustomerWithStore[]
  canAccessAllStores?: boolean
  stores?: Store[]
  userStoreId?: string | null
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isViewingDetails, setIsViewingDetails] = useState(false)
  const [currency, setCurrency] = useState<Currency | null>(null)
  const router = useRouter()

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  const customersWithDebt = customers.filter((c) => Number(c.balance) > 0)
  
  // Helper to get store name
  const getStoreName = (customer: CustomerWithStore) => {
    if (customer.stores) return customer.stores.name
    if (customer.store_id) {
      const store = stores.find(s => s.id === customer.store_id)
      return store?.name || "Unknown Store"
    }
    return "No Store"
  }

  const handlePayment = async () => {
    if (!selectedCustomer) return
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    const amount = Number.parseFloat(paymentAmount)
    const currentBalance = Number(selectedCustomer.balance)

    if (amount > currentBalance) {
      alert("Payment amount cannot exceed current balance")
      return
    }

    setIsProcessing(true)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("You must be logged in")
        return
      }

      const paymentNumber = `PAY-${Date.now()}`

      // Determine store_id: use customer's store_id, or user's store_id, or get from user's profile
      let paymentStoreId = selectedCustomer.store_id || userStoreId
      
      // If still no store_id, get from user's profile
      if (!paymentStoreId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("store_id")
          .eq("id", user.id)
          .single()
        
        paymentStoreId = profile?.store_id || null
      }
      
      // If still no store_id, get default store
      if (!paymentStoreId) {
        const { data: defaultStore } = await supabase
          .from("stores")
          .select("id")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .single()
        
        paymentStoreId = defaultStore?.id || null
      }
      
      if (!paymentStoreId) {
        alert("Unable to determine store. Please contact administrator.")
        setIsProcessing(false)
        return
      }

      // Record payment with store_id
      const { error: paymentError } = await supabase.from("customer_payments").insert({
        payment_number: paymentNumber,
        customer_id: selectedCustomer.id,
        store_id: paymentStoreId,
        amount,
        payment_method: paymentMethod,
        notes: notes || null,
        created_by: user.id,
      })

      if (paymentError) throw paymentError

      // Update customer balance
      const newBalance = currentBalance - amount
      const { error: balanceError } = await supabase
        .from("customers")
        .update({ balance: newBalance })
        .eq("id", selectedCustomer.id)

      if (balanceError) throw balanceError

      alert(`Payment recorded successfully! Payment #${paymentNumber}`)
      setIsOpen(false)
      setPaymentAmount("")
      setNotes("")
      setSelectedCustomer(null)
      router.refresh()
    } catch (error: unknown) {
      alert(`Error recording payment: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <LoadingDialog isOpen={isProcessing} message="Processing payment..." />
      <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers with Credit</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersWithDebt.length}</div>
            <p className="text-xs text-muted-foreground">of {customers.length} total customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding Credit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency
                ? formatCurrency(
                    customers.reduce((sum, c) => sum + Number(c.balance), 0),
                    currency,
                  )
                : `$${customers.reduce((sum, c) => sum + Number(c.balance), 0).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">across all customers</p>
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers with Outstanding Credit</CardTitle>
          <CardDescription>Manage customer credit balances and record payments</CardDescription>
        </CardHeader>
        <CardContent>
          {customersWithDebt.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No customers with outstanding credit</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  {canAccessAllStores && <TableHead>Store</TableHead>}
                  <TableHead>Current Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersWithDebt.map((customer) => {
                  const balance = Number(customer.balance)

                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{customer.email || "-"}</div>
                          <div className="text-muted-foreground">{customer.phone || "-"}</div>
                        </div>
                      </TableCell>
                      {canAccessAllStores && (
                        <TableCell>
                          <Badge variant="outline">{getStoreName(customer)}</Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="font-semibold text-red-600">
                          {currency ? formatCurrency(balance, currency) : `$${balance.toFixed(2)}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsViewingDetails(true)
                              router.push(`/dashboard/credit/${customer.id}`)
                            }}
                            disabled={isViewingDetails}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {isViewingDetails ? "Loading..." : "View Details"}
                          </Button>
                          <Dialog
                            open={isOpen && selectedCustomer?.id === customer.id}
                            onOpenChange={(open) => {
                              setIsOpen(open)
                              if (open) setSelectedCustomer(customer)
                              else setSelectedCustomer(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm">Record Payment</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Record Payment - {customer.name}</DialogTitle>
                                <DialogDescription>
                                  Record a credit payment to reduce customer balance
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current Balance:</span>
                                    <span className="font-bold text-red-600">
                                      {currency ? formatCurrency(balance, currency) : `$${balance.toFixed(2)}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid gap-2">
                                  <Label htmlFor="paymentAmount">Payment Amount *</Label>
                                  <Input
                                    id="paymentAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={balance}
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                  />
                                  {paymentAmount && (
                                    <p className="text-xs text-muted-foreground">
                                      New balance:{" "}
                                      {currency
                                        ? formatCurrency(balance - Number.parseFloat(paymentAmount), currency)
                                        : `$${(balance - Number.parseFloat(paymentAmount)).toFixed(2)}`}
                                    </p>
                                  )}
                                </div>

                                <div className="grid gap-2">
                                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger id="paymentMethod">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="cash">Cash</SelectItem>
                                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                      <SelectItem value="cheque">Cheque</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid gap-2">
                                  <Label htmlFor="notes">Notes (Optional)</Label>
                                  <Input
                                    id="notes"
                                    placeholder="Payment notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button onClick={handlePayment} disabled={isProcessing} className="flex-1">
                                    {isProcessing ? "Processing..." : "Record Payment"}
                                  </Button>
                                  <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    <LoadingDialog isOpen={isViewingDetails} message="Loading credit details..." />
    </>
  )
}
