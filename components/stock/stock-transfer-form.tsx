"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowRight, Package, List, Search, X } from "lucide-react"
import Link from "next/link"
import type { Store, Product } from "@/lib/types/database"

type ProductWithStore = Product & {
  store_id: string
  categories?: { name: string } | null
  units?: { short_name: string } | null
}

export function StockTransferForm({ 
  products, 
  stores, 
  userId,
  userStoreId,
  canAccessAllStores 
}: { 
  products: ProductWithStore[]; 
  stores: Store[]; 
  userId: string;
  userStoreId: string | null;
  canAccessAllStores: boolean;
}) {
  const [fromStoreId, setFromStoreId] = useState<string>("")
  const [toStoreId, setToStoreId] = useState<string>("")
  const [productId, setProductId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [availableProducts, setAvailableProducts] = useState<ProductWithStore[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStore | null>(null)
  const [productSearchTerm, setProductSearchTerm] = useState("")

  const activeStores = stores.filter((s) => s.is_active)
  
  // Filter stores for "from store" - users can only select their own store unless admin
  const availableFromStores = canAccessAllStores 
    ? activeStores 
    : activeStores.filter((s) => s.id === userStoreId)

  // Auto-select user's store as "from store" and the other store as "to store"
  useEffect(() => {
    if (!canAccessAllStores && userStoreId && availableFromStores.length === 1 && !fromStoreId) {
      setFromStoreId(userStoreId)
      
      // Auto-select the other store as "to store" if there are only 2 stores
      const otherStore = activeStores.find((s) => s.id !== userStoreId)
      if (otherStore && activeStores.length === 2) {
        setToStoreId(otherStore.id)
      }
    }
  }, [canAccessAllStores, userStoreId, availableFromStores.length, fromStoreId, activeStores])

  useEffect(() => {
    if (fromStoreId) {
      const filtered = products.filter((p) => p.store_id === fromStoreId && p.is_active && p.stock_quantity > 0)
      setAvailableProducts(filtered)
      setProductId("")
      setSelectedProduct(null)
      setProductSearchTerm("") // Clear search when store changes
    } else {
      setAvailableProducts([])
      setProductId("")
      setSelectedProduct(null)
      setProductSearchTerm("") // Clear search when store changes
    }
  }, [fromStoreId, products])

  useEffect(() => {
    if (productId) {
      const product = availableProducts.find((p) => p.id === productId)
      setSelectedProduct(product || null)
      setQuantity("")
    } else {
      setSelectedProduct(null)
    }
  }, [productId, availableProducts])

  // Filter products based on search term
  const filteredProducts = availableProducts.filter((product) => {
    if (!productSearchTerm.trim()) return true
    const searchLower = productSearchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower) ||
      product.barcode?.toLowerCase().includes(searchLower)
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fromStoreId || !toStoreId || !productId || !quantity) {
      setError("Please fill in all required fields")
      return
    }

    if (fromStoreId === toStoreId) {
      setError("Source and destination stores must be different")
      return
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number")
      return
    }

    if (selectedProduct && qty > selectedProduct.stock_quantity) {
      setError(`Insufficient stock. Available: ${selectedProduct.stock_quantity}`)
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Generate transfer number
      const { data: lastTransfer } = await supabase
        .from("stock_transfers")
        .select("transfer_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      let transferNumber = "TRF-0001"
      if (lastTransfer?.transfer_number) {
        const lastNum = parseInt(lastTransfer.transfer_number.split("-")[1] || "0")
        transferNumber = `TRF-${String(lastNum + 1).padStart(4, "0")}`
      }

      const { data: transferData, error: insertError } = await supabase.from("stock_transfers").insert({
        transfer_number: transferNumber,
        from_store_id: fromStoreId,
        to_store_id: toStoreId,
        product_id: productId,
        quantity: qty,
        status: "pending",
        notes: notes.trim() || null,
        created_by: userId,
      }).select().single()

      if (insertError) throw insertError

      // Get users from the destination store to notify them
      const { data: storeUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("store_id", toStoreId)
        .eq("is_active", true)

      // Create notifications for all users in the destination store
      if (storeUsers && storeUsers.length > 0 && transferData) {
        const fromStore = stores.find((s) => s.id === fromStoreId)
        const product = selectedProduct
        
        const notifications = storeUsers.map((user) => ({
          user_id: user.id,
          type: "stock_transfer",
          title: "New Stock Transfer",
          message: `${qty} ${product?.units?.short_name || "units"} of ${product?.name || "product"} transferred from ${fromStore?.name || "store"}. Please confirm receipt.`,
          related_id: transferData.id,
          is_read: false,
        }))

        await supabase.from("notifications").insert(notifications)
      }

      // Reset form
      setFromStoreId("")
      setToStoreId("")
      setProductId("")
      setQuantity("")
      setNotes("")
      setSelectedProduct(null)

      router.refresh()
      alert("Stock transfer created successfully! The receiving store has been notified.")
    } catch (error: any) {
      setError(error.message || "Failed to create stock transfer")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <LoadingDialog isOpen={isSubmitting} message="Creating stock transfer..." />
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Transfer Stock Between Stores
            </CardTitle>
            <CardDescription>Move stock from one store to another</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/stock/transfers">
              <List className="h-4 w-4 mr-2" />
              View Transfer Logs
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromStore">From Store *</Label>
              <Select 
                value={fromStoreId} 
                onValueChange={setFromStoreId}
                disabled={!canAccessAllStores && availableFromStores.length === 1 && availableFromStores[0]?.id === userStoreId}
              >
                <SelectTrigger id="fromStore">
                  <SelectValue placeholder="Select source store" />
                </SelectTrigger>
                <SelectContent>
                  {availableFromStores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canAccessAllStores && userStoreId && (
                <p className="text-xs text-muted-foreground">You can only transfer from your assigned store</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="toStore">To Store *</Label>
              <Select value={toStoreId} onValueChange={setToStoreId} disabled={!fromStoreId}>
                <SelectTrigger id="toStore">
                  <SelectValue placeholder="Select destination store" />
                </SelectTrigger>
                <SelectContent>
                  {activeStores
                    .filter((store) => store.id !== fromStoreId)
                    .map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {!canAccessAllStores && activeStores.length === 2 && (
                <p className="text-xs text-muted-foreground">Transferring to the other store</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            {fromStoreId && availableProducts.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products by name, SKU, or barcode..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={!fromStoreId}
                />
                {productSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setProductSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <Select value={productId} onValueChange={setProductId} disabled={!fromStoreId}>
              <SelectTrigger id="product">
                <SelectValue placeholder={fromStoreId ? "Select product" : "Select source store first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.stock_quantity} {product.units?.short_name || ""} available)
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {productSearchTerm ? "No products found matching your search" : "No products available"}
                  </div>
                )}
              </SelectContent>
            </Select>
            {availableProducts.length === 0 && fromStoreId && (
              <p className="text-sm text-muted-foreground">No products with stock available in this store</p>
            )}
            {productSearchTerm && filteredProducts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredProducts.length} of {availableProducts.length} products
              </p>
            )}
          </div>

          {selectedProduct && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Available Stock:</span>
                <span className="text-sm">
                  {selectedProduct.stock_quantity} {selectedProduct.units?.short_name || ""}
                </span>
              </div>
              {selectedProduct.categories && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Category:</span>
                  <span className="text-sm">{selectedProduct.categories.name}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedProduct?.stock_quantity || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              disabled={!productId}
              required
            />
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Maximum: {selectedProduct.stock_quantity} {selectedProduct.units?.short_name || ""}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes about this transfer" rows={3} />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !fromStoreId || !toStoreId || !productId || !quantity}>
              {isSubmitting ? "Creating..." : (
                <>
                  Create Transfer <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </>
  )
}
