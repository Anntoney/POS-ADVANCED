"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import type { Product } from "@/lib/types/database"

type Category = { id: string; name: string }
type Unit = { id: string; name: string; short_name: string }

interface ProductFormProps {
  product?: Product
  categories: Category[]
  units: Unit[]
}

export function ProductForm({ product, categories, units }: ProductFormProps) {
  const [name, setName] = useState(product?.name || "")
  const [categoryId, setCategoryId] = useState(product?.category_id || "")
  const [costPrice, setCostPrice] = useState(product?.cost_price.toString() || "0")
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price.toString() || "0")
  const [wholesalePrice, setWholesalePrice] = useState(
    product && "wholesale_price" in product ? (product as any).wholesale_price?.toString() || "0" : "0"
  )
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity.toString() || "0")
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

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

    // Get store_id from URL query parameter (if admin selected a store) or from user's profile
    const storeIdFromUrl = searchParams.get("storeId")
    let storeId: string | null = null
    
    if (storeIdFromUrl && storeIdFromUrl !== "both") {
      // Use the store ID from URL if provided (admin selected a store)
      storeId = storeIdFromUrl
    } else {
      // Fall back to user's profile store_id
      const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.id).single()
      storeId = profile?.store_id || null
    }

    // Validate that store_id is set (required for product creation)
    if (!product && !storeId) {
      setError("Please select a store before creating a product. Go back to the products page and select a store.")
      setIsLoading(false)
      return
    }

    const productData = {
      name,
      category_id: categoryId || null,
      cost_price: Number.parseFloat(costPrice),
      selling_price: Number.parseFloat(sellingPrice),
      wholesale_price: Number.parseFloat(wholesalePrice),
      stock_quantity: Number.parseInt(stockQuantity),
      is_active: isActive,
      store_id: storeId,
    }

    try {
      if (product) {
        // Update existing product
        const { error } = await supabase.from("products").update(productData).eq("id", product.id)

        if (error) throw error
        alert("Product updated successfully!")
        router.push("/dashboard/products")
        router.refresh()
      } else {
        // Create new product
        const { error } = await supabase.from("products").insert({
          ...productData,
          created_by: user.id,
        })

        if (error) throw error
        alert("Product created successfully!")

        // Clear the form
        setName("")
        setCategoryId("")
        setCostPrice("0")
        setSellingPrice("0")
        setWholesalePrice("0")
        setStockQuantity("0")
        setIsActive(true)

        // Navigate to products list
        router.push("/dashboard/products")
        router.refresh()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{product ? "Edit Product" : "Create New Product"}</CardTitle>
        <CardDescription>
          {product ? "Update the product information below" : "Fill in the details to create a new product"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="Enter product name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="costPrice">Cost Price (Buying Price) *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sellingPrice">Selling Price *</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="wholesalePrice">Wholesale Price *</Label>
              <Input
                id="wholesalePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stockQuantity">Stock Quantity *</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                placeholder="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Active</Label>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
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
