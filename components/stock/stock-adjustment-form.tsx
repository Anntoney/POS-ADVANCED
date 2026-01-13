"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Product = {
  id: string
  name: string
  sku: string
  stock_quantity: number
  units: { short_name: string } | null
}

export function StockAdjustmentForm({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<string>("")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const selectedProduct = products.find((p) => p.id === productId)

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
      setError("Please enter a valid quantity")
      setIsLoading(false)
      return
    }

    try {
      // Create stock adjustment record
      const { error: adjustmentError } = await supabase.from("stock_adjustments").insert({
        product_id: productId,
        adjustment_type: adjustmentType,
        quantity: adjustmentQty,
        reason,
        created_by: user.id,
      })

      if (adjustmentError) throw adjustmentError

      // Update product stock quantity
      const product = products.find((p) => p.id === productId)
      if (!product) throw new Error("Product not found")

      let newQuantity = product.stock_quantity
      if (adjustmentType === "addition") {
        newQuantity += adjustmentQty
      } else {
        newQuantity -= adjustmentQty
      }

      // Ensure stock doesn't go negative
      if (newQuantity < 0) {
        throw new Error("Stock quantity cannot be negative")
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newQuantity })
        .eq("id", productId)

      if (updateError) throw updateError

      // Show success message
      alert("Stock adjusted successfully!")
      
      // Force full page refresh to ensure all views are updated
      window.location.href = "/dashboard/stock"
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <>
      <LoadingDialog isOpen={isLoading} message="Saving stock adjustment..." />
      <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Stock Adjustment</CardTitle>
        <CardDescription>Add or remove stock from your inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.sku}) - Current: {product.stock_quantity} {product.units?.short_name || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p>
                <strong>Current Stock:</strong> {selectedProduct.stock_quantity}{" "}
                {selectedProduct.units?.short_name || ""}
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="adjustmentType">Adjustment Type *</Label>
            <Select value={adjustmentType} onValueChange={setAdjustmentType}>
              <SelectTrigger id="adjustmentType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="addition">Addition (Increase Stock)</SelectItem>
                <SelectItem value="subtraction">Subtraction (Decrease Stock)</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
              </SelectContent>
            </Select>
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
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Reason for stock adjustment..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading || !productId || !adjustmentType}>
              {isLoading ? "Saving..." : "Submit Adjustment"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </>
  )
}
