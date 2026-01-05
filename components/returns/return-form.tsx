"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type Sale = {
  id: string
  sale_number: string
  sale_date: string
  total_amount: number
  customers: { name: string } | null
}

type SaleItem = {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
}

type Product = {
  id: string
  name: string
  stock_quantity: number
}

export function ReturnForm() {
  const [open, setOpen] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [selectedSaleId, setSelectedSaleId] = useState<string>("")
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [returnItems, setReturnItems] = useState<Record<string, number>>({})
  const [refundMethod, setRefundMethod] = useState<string>("cash")
  const [notes, setNotes] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [currency, setCurrency] = useState<Currency | null>(null)
  const router = useRouter()

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
    loadSales()
  }, [])

  // Reload sales when dialog opens to ensure we have the latest list
  useEffect(() => {
    if (open) {
      loadSales()
      // Clear selection when dialog opens
      setSelectedSaleId("")
      setSaleItems([])
      setReturnItems({})
      setNotes("")
    }
  }, [open])

  useEffect(() => {
    if (selectedSaleId) {
      loadSaleItems(selectedSaleId)
    } else {
      setSaleItems([])
      setReturnItems({})
    }
  }, [selectedSaleId])

  const loadSales = async () => {
    const supabase = createClient()
    
    // First, get all sale IDs that have been returned (where sale_id is not null)
    const { data: returns } = await supabase
      .from("sale_returns")
      .select("sale_id")
      .not("sale_id", "is", null)

    const returnedSaleIds = new Set(returns?.map((r) => r.sale_id).filter((id) => id !== null) || [])

    // Then, get all sales
    const { data } = await supabase
      .from("sales")
      .select(`
        id,
        sale_number,
        sale_date,
        total_amount,
        customers (name)
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    // Filter out sales that have been returned
    if (data) {
      const availableSales = data.filter((sale) => !returnedSaleIds.has(sale.id))
      setSales(availableSales as Sale[])
    }
  }

  const loadSaleItems = async (saleId: string) => {
    const supabase = createClient()
    const { data } = await supabase.from("sale_items").select("*").eq("sale_id", saleId)

    if (data) {
      setSaleItems(data as SaleItem[])
      // Initialize return quantities to 0
      const initialReturns: Record<string, number> = {}
      data.forEach((item) => {
        initialReturns[item.id] = 0
      })
      setReturnItems(initialReturns)
    }
  }

  const updateReturnQuantity = (itemId: string, quantity: number) => {
    const item = saleItems.find((i) => i.id === itemId)
    if (!item) return

    const maxQuantity = item.quantity
    const newQuantity = Math.max(0, Math.min(quantity, maxQuantity))

    setReturnItems((prev) => ({
      ...prev,
      [itemId]: newQuantity,
    }))
  }

  const calculateTotal = () => {
    return saleItems.reduce((total, item) => {
      const returnQty = returnItems[item.id] || 0
      if (returnQty === 0) return total
      const itemTotal = (returnQty / item.quantity) * Number(item.total_amount)
      return total + itemTotal
    }, 0)
  }

  const hasReturnItems = () => {
    return Object.values(returnItems).some((qty) => qty > 0)
  }

  const handleSubmit = async () => {
    if (!selectedSaleId) {
      alert("Please select a sale")
      return
    }

    if (!hasReturnItems()) {
      alert("Please select items to return")
      return
    }

    if (!confirm("Are you sure you want to process this return? Items will be added back to stock.")) {
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Generate return number
      const returnNumber = `RET-${Date.now()}`

      // Calculate total return amount
      const totalAmount = calculateTotal()

      // Create return record
      const { data: returnRecord, error: returnError } = await supabase
        .from("sale_returns")
        .insert({
          return_number: returnNumber,
          sale_id: selectedSaleId,
          total_amount: totalAmount,
          refund_method: refundMethod,
          notes: notes || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (returnError) throw returnError

      // Process each return item
      for (const item of saleItems) {
        const returnQty = returnItems[item.id] || 0
        if (returnQty === 0) continue

        // Create return item record
        const itemReturnAmount = (returnQty / item.quantity) * Number(item.total_amount)
        const { error: itemError } = await supabase.from("sale_return_items").insert({
          sale_return_id: returnRecord.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: returnQty,
          unit_price: item.unit_price,
          total_amount: itemReturnAmount,
        })

        if (itemError) throw itemError

        // Update product stock (add back to stock)
        const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single()

        if (product) {
          const newStock = Number(product.stock_quantity) + returnQty
          const { error: stockError } = await supabase
            .from("products")
            .update({ stock_quantity: newStock })
            .eq("id", item.product_id)

          if (stockError) throw stockError
        }
      }

      // Delete the sale and its items (as per requirement: "removed from sales")
      const { error: deleteItemsError } = await supabase.from("sale_items").delete().eq("sale_id", selectedSaleId)
      if (deleteItemsError) throw deleteItemsError

      const { error: deleteSaleError } = await supabase.from("sales").delete().eq("id", selectedSaleId)
      if (deleteSaleError) throw deleteSaleError

      alert("Return processed successfully! Items have been added back to stock and the sale has been removed.")
      setOpen(false)
      setSelectedSaleId("")
      setSaleItems([])
      setReturnItems({})
      setNotes("")
      // Reload sales list to remove the returned sale
      await loadSales()
      router.refresh()
    } catch (error: any) {
      console.error("Error processing return:", error)
      alert("Error processing return: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedSale = sales.find((s) => s.id === selectedSaleId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Process Return
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-4xl !w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Process Sale Return</DialogTitle>
          <DialogDescription className="text-base">Select a sale and items to return. Items will be added back to stock.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="sale" className="text-base font-medium">Select Sale</Label>
            <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
              <SelectTrigger id="sale">
                <SelectValue placeholder="Select a sale to return" />
              </SelectTrigger>
              <SelectContent>
                {sales.map((sale) => (
                  <SelectItem key={sale.id} value={sale.id}>
                    {sale.sale_number} - {sale.customers?.name || "Walk-in"} -{" "}
                    {currency ? formatCurrency(Number(sale.total_amount), currency) : `$${Number(sale.total_amount).toFixed(2)}`} -{" "}
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSale && saleItems.length > 0 && (
            <>
              <div className="space-y-2">
                <Label className="text-base font-medium">Return Items</Label>
                <div className="rounded-md border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Original Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Return Qty</TableHead>
                        <TableHead className="text-right">Return Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleItems.map((item) => {
                        const returnQty = returnItems[item.id] || 0
                        const returnAmount = returnQty > 0 ? (returnQty / item.quantity) * Number(item.total_amount) : 0
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              {currency ? formatCurrency(Number(item.unit_price), currency) : `$${Number(item.unit_price).toFixed(2)}`}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateReturnQuantity(item.id, returnQty - 1)}
                                  disabled={returnQty === 0}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.quantity}
                                  value={returnQty}
                                  onChange={(e) => updateReturnQuantity(item.id, parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateReturnQuantity(item.id, returnQty + 1)}
                                  disabled={returnQty >= item.quantity}
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {currency ? formatCurrency(returnAmount, currency) : `$${returnAmount.toFixed(2)}`}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-method" className="text-base font-medium">Refund Method</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger id="refund-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-medium">Notes (Optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Return reason or notes..." />
              </div>

              <div className="border-t pt-4 bg-muted/30 p-4 rounded-md">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Return Amount:</span>
                  <span className="text-primary">{currency ? formatCurrency(calculateTotal(), currency) : `$${calculateTotal().toFixed(2)}`}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !hasReturnItems()}>
            {isLoading ? "Processing..." : "Process Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
