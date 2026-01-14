"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { createClient } from "@/lib/supabase/client"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type Product = {
  id: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  store_id: string | null
}

type Store = {
  id: string
  name: string
}

export function ProductsValueCards({ 
  products, 
  canAccessAllStores,
  userStoreId,
  selectedStoreId,
  onStoreChange
}: { 
  products: Product[]
  canAccessAllStores: boolean
  userStoreId: string | null
  selectedStoreId?: string | null
  onStoreChange?: (storeId: string) => void
}) {
  const [currency, setCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  // Filter products based on selected store
  const filteredProducts = selectedStoreId
    ? products.filter((p) => {
        if (selectedStoreId === "both") return true
        return p.store_id === selectedStoreId
      })
    : []

  // Calculate totals
  const totalBuyingValue = filteredProducts.reduce((sum, product) => {
    return sum + Number(product.cost_price || 0) * Number(product.stock_quantity || 0)
  }, 0)

  const totalSellingValue = filteredProducts.reduce((sum, product) => {
    return sum + Number(product.selling_price || 0) * Number(product.stock_quantity || 0)
  }, 0)

  // For non-admins, always show values (they only see their store)
  const shouldShowValues = !canAccessAllStores || (selectedStoreId !== null && selectedStoreId !== "")

  return (
    <>
      {shouldShowValues && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Total Buying Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBuyingValue, currency)}</div>
              <p className="text-sm text-muted-foreground mt-1">Total value at cost price</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Total Selling Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSellingValue, currency)}</div>
              <p className="text-sm text-muted-foreground mt-1">Total value at selling price</p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
