"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, History } from "lucide-react"
import Link from "next/link"

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
  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (quantity <= minLevel) return { label: "Low Stock", variant: "default" as const }
    return { label: "In Stock", variant: "secondary" as const }
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    )
  }

  return (
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
          {products.map((product) => {
            const status = getStockStatus(product.stock_quantity, product.min_stock_level)
            const isLowStock = product.stock_quantity <= product.min_stock_level

            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.categories?.name || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {product.stock_quantity} {product.units?.short_name || ""}
                    {isLowStock && <AlertTriangle className="h-4 w-4 text-orange-500" />}
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
          })}
        </TableBody>
      </Table>
    </div>
  )
}
