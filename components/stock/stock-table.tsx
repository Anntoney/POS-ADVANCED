"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, History, Plus, Minus, Search } from "lucide-react"
import Link from "next/link"
import { QuickStockAdjustDialog } from "./quick-stock-adjust-dialog"

type ProductStock = {
  id: string
  name: string
  sku: string
  stock_quantity: number
  min_stock_level: number
  categories: { name: string } | null
  units: { short_name: string } | null
}

export function StockTable({ products }: { products: ProductStock[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add")

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (quantity <= minLevel) return { label: "Low Stock", variant: "default" as const }
    return { label: "In Stock", variant: "secondary" as const }
  }

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      (product.categories?.name || "").toLowerCase().includes(query)
    )
  })

  const handleQuickAdjust = (product: ProductStock, type: "add" | "subtract") => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setIsDialogOpen(true)
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Min Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found matching "{searchQuery}"
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const status = getStockStatus(product.stock_quantity, product.min_stock_level)
                const isLowStock = product.stock_quantity <= product.min_stock_level

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.categories?.name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>
                          {product.stock_quantity} {product.units?.short_name || ""}
                        </span>
                        {isLowStock && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleQuickAdjust(product, "add")}
                            title="Add stock"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleQuickAdjust(product, "subtract")}
                            disabled={product.stock_quantity === 0}
                            title="Subtract stock"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.min_stock_level} {product.units?.short_name || ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/stock/history/${product.id}`}>
                          <History className="h-4 w-4 mr-2" />
                          History
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedProduct && (
        <QuickStockAdjustDialog
          product={selectedProduct}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedProduct(null)
          }}
          adjustmentType={adjustmentType}
        />
      )}
    </>
  )
}
