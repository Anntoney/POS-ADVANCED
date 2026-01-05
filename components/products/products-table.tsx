"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type ProductWithRelations = {
  id: string
  name: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  is_active: boolean
  categories: { id: string; name: string } | null
  units: { id: string; name: string; short_name: string } | null
}

export function ProductsTable({ products }: { products: ProductWithRelations[] }) {
  const router = useRouter()
  const [currency, setCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      alert("Error deleting product: " + error.message)
    } else {
      router.refresh()
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No products found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/products/new">Create your first product</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Buying Price</TableHead>
            <TableHead>Selling Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.categories?.name || "-"}</TableCell>
                <TableCell>
                  {currency
                    ? formatCurrency(Number(product.cost_price || 0), currency)
                    : `$${Number(product.cost_price || 0).toFixed(2)}`}
                </TableCell>
                <TableCell>
                  {currency
                    ? formatCurrency(Number(product.selling_price), currency)
                    : `$${Number(product.selling_price).toFixed(2)}`}
                </TableCell>
                <TableCell>
                  {product.stock_quantity} {product.units?.short_name || ""}
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
