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
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { AddProductButton } from "@/components/products/add-product-button"

type ProductWithRelations = {
  id: string
  name: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  is_active: boolean
  store_id: string | null
  categories: { id: string; name: string } | null
  units: { id: string; name: string; short_name: string } | null
}

export function ProductsTable({ 
  products, 
  canAccessAllStores,
  userStoreId,
  selectedStoreId,
  searchQuery
}: { 
  products: ProductWithRelations[]
  canAccessAllStores: boolean
  userStoreId: string | null
  selectedStoreId?: string | null
  searchQuery?: string
}) {
  const router = useRouter()
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [isNavigatingToEdit, setIsNavigatingToEdit] = useState(false)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  const handleEditClick = (productId: string) => {
    setIsNavigatingToEdit(true)
    router.push(`/dashboard/products/${productId}/edit`)
  }

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

  // For admins, don't show products until store is selected
  if (canAccessAllStores && !selectedStoreId) {
    return (
      <>
        <LoadingDialog isOpen={isNavigatingToEdit} message="Loading product..." />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Please select a store above to view products</p>
          <div className="mt-4">
            <AddProductButton selectedStoreId={selectedStoreId} />
          </div>
        </div>
      </>
    )
  }

  // Filter products based on selected store
  const displayProducts = selectedStoreId === "both" 
    ? products 
    : selectedStoreId
    ? products.filter(p => p.store_id === selectedStoreId)
    : products

  if (displayProducts.length === 0) {
    return (
      <>
        <LoadingDialog isOpen={isNavigatingToEdit} message="Loading product..." />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? `No products found matching "${searchQuery}"` : "No products found"}
          </p>
          <div className="mt-4">
            <AddProductButton selectedStoreId={selectedStoreId} />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <LoadingDialog isOpen={isNavigatingToEdit} message="Loading product..." />
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
            {displayProducts.map((product) => {
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
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditClick(product.id)}
                      >
                        <Edit className="h-4 w-4" />
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
    </>
  )
}
