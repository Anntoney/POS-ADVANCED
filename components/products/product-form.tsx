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
import { useRouter } from "next/navigation"
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
  const [sku, setSku] = useState(product?.sku || "")
  const [barcode, setBarcode] = useState(product?.barcode || "")
  const [categoryId, setCategoryId] = useState(product?.category_id || "")
  const [unitId, setUnitId] = useState(product?.unit_id || "")
  const [description, setDescription] = useState(product?.description || "")
  const [costPrice, setCostPrice] = useState(product?.cost_price.toString() || "0")
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price.toString() || "0")
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity.toString() || "0")
  const [minStockLevel, setMinStockLevel] = useState(product?.min_stock_level.toString() || "10")
  const [taxRate, setTaxRate] = useState(product?.tax_rate.toString() || "0")
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
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

    const productData = {
      name,
      sku,
      barcode: barcode || null,
      category_id: categoryId || null,
      unit_id: unitId || null,
      description: description || null,
      cost_price: Number.parseFloat(costPrice),
      selling_price: Number.parseFloat(sellingPrice),
      stock_quantity: Number.parseInt(stockQuantity),
      min_stock_level: Number.parseInt(minStockLevel),
      tax_rate: Number.parseFloat(taxRate),
      is_active: isActive,
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
        setSku("")
        setBarcode("")
        setCategoryId("")
        setUnitId("")
        setDescription("")
        setCostPrice("0")
        setSellingPrice("0")
        setStockQuantity("0")
        setMinStockLevel("10")
        setTaxRate("0")
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
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" placeholder="PROD-001" required value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                placeholder="1234567890123"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
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
              <Label htmlFor="unit">Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.short_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="costPrice">Cost Price *</Label>
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

            <div className="grid gap-2">
              <Label htmlFor="minStockLevel">Min Stock Level *</Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                placeholder="10"
                required
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Product description..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
