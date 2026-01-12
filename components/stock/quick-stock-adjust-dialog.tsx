"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ProductStock = {
  id: string
  name: string
  sku: string
  stock_quantity: number
  min_stock_level: number
  categories: { name: string } | null
  units: { short_name: string } | null
}

interface QuickStockAdjustDialogProps {
  product: ProductStock
  isOpen: boolean
  onClose: () => void
  adjustmentType: "add" | "subtract"
}

export function QuickStockAdjustDialog({
  product,
  isOpen,
  onClose,
  adjustmentType,
}: QuickStockAdjustDialogProps) {
  const [quantity, setQuantity] = useState("1")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setQuantity("1")
      setReason("")
      setError(null)
    }
  }, [isOpen])

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

    const adjustmentQty = Number.parseInt(quantity)
    if (Number.isNaN(adjustmentQty) || adjustmentQty <= 0) {
      setError("Please enter a valid quantity greater than 0")
      setIsLoading(false)
      return
    }

    try {
      const adjustmentTypeValue = adjustmentType === "add" ? "addition" : "subtraction"
      
      // Calculate new quantity
      let newQuantity = product.stock_quantity
      if (adjustmentType === "add") {
        newQuantity += adjustmentQty
      } else {
        newQuantity -= adjustmentQty
      }

      // Ensure stock doesn't go negative
      if (newQuantity < 0) {
        setError("Stock quantity cannot be negative")
        setIsLoading(false)
        return
      }

      // Create stock adjustment record
      const { error: adjustmentError } = await supabase.from("stock_adjustments").insert({
        product_id: product.id,
        adjustment_type: adjustmentTypeValue,
        quantity: adjustmentQty,
        reason: reason || null,
        created_by: user.id,
      })

      if (adjustmentError) throw adjustmentError

      // Update product stock quantity
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newQuantity })
        .eq("id", product.id)

      if (updateError) throw updateError

      // Close dialog and refresh to show updated stock
      onClose()
      // Use setTimeout to ensure dialog closes before refresh
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {adjustmentType === "add" ? "Add" : "Subtract"} Stock - {product.name}
          </DialogTitle>
          <DialogDescription>
            Quick stock adjustment for {product.name} ({product.sku})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-sm">
            <p>
              <strong>Current Stock:</strong> {product.stock_quantity}{" "}
              {product.units?.short_name || ""}
            </p>
            <p className="mt-1">
              <strong>After adjustment:</strong>{" "}
              {adjustmentType === "add"
                ? product.stock_quantity + (Number.parseInt(quantity) || 0)
                : Math.max(0, product.stock_quantity - (Number.parseInt(quantity) || 0))}{" "}
              {product.units?.short_name || ""}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="Enter quantity"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Reason for stock adjustment..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Processing..."
                : adjustmentType === "add"
                  ? `Add ${quantity} ${product.units?.short_name || ""}`
                  : `Subtract ${quantity} ${product.units?.short_name || ""}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
