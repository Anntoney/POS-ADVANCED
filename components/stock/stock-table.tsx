"use client"

import { useState, useEffect, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { History, Plus, Minus, Search, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { QuickStockAdjustDialog } from "./quick-stock-adjust-dialog"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type ProductStock = {
  id: string
  name: string
  stock_quantity: number
  store_id: string | null
  units: { short_name: string } | null
  cost_price: number
  selling_price: number
  wholesale_price: number | null
}

type Store = {
  id: string
  name: string
}

export function StockTable({ 
  stores, 
  canAccessAllStores,
  userStoreId
}: { 
  stores: Store[]
  canAccessAllStores: boolean
  userStoreId: string | null
}) {
  const [products, setProducts] = useState<ProductStock[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(userStoreId || null)
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  // Price editing dialog state
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [priceEditType, setPriceEditType] = useState<"cost" | "selling" | "wholesale">("selling")
  const [editedPrice, setEditedPrice] = useState<string>("")
  const [isSavingPrice, setIsSavingPrice] = useState(false)
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  // Product name editing dialog state
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [editedName, setEditedName] = useState<string>("")
  const [isSavingName, setIsSavingName] = useState(false)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const scrollbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
    
    // For non-admins, auto-load products for their store
    if (!canAccessAllStores && userStoreId) {
      loadProducts(userStoreId)
    }
  }, [])

  // Sync scroll between table and scrollbar
  useEffect(() => {
    const tableContainer = tableContainerRef.current
    const scrollbar = scrollbarRef.current

    if (!tableContainer || !scrollbar) return

    const handleTableScroll = () => {
      scrollbar.scrollLeft = tableContainer.scrollLeft
    }

    const handleScrollbarScroll = () => {
      tableContainer.scrollLeft = scrollbar.scrollLeft
    }

    tableContainer.addEventListener('scroll', handleTableScroll)
    scrollbar.addEventListener('scroll', handleScrollbarScroll)

    // Set scrollbar width to match table width
    const updateScrollbarWidth = () => {
      if (tableContainer.scrollWidth > tableContainer.clientWidth) {
        const scrollbarContent = scrollbar.querySelector('div') as HTMLElement
        if (scrollbarContent) {
          scrollbarContent.style.width = `${tableContainer.scrollWidth}px`
        }
      }
    }

    updateScrollbarWidth()
    const resizeObserver = new ResizeObserver(updateScrollbarWidth)
    resizeObserver.observe(tableContainer)

    return () => {
      tableContainer.removeEventListener('scroll', handleTableScroll)
      scrollbar.removeEventListener('scroll', handleScrollbarScroll)
      resizeObserver.disconnect()
    }
  }, [products, searchQuery])

  // Load products when store is selected
  useEffect(() => {
    if (selectedStoreId && canAccessAllStores) {
      loadProducts(selectedStoreId)
    }
  }, [selectedStoreId, canAccessAllStores])

  const loadProducts = async (storeId: string) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          stock_quantity,
          store_id,
          cost_price,
          selling_price,
          wholesale_price,
          units (short_name)
        `)
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("stock_quantity", { ascending: true })

      if (error) throw error
      setProducts((data as any) || [])
    } catch (error) {
      console.error("Error loading products:", error)
      alert("Error loading products. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (quantity <= 10) return { label: "Low Stock", variant: "default" as const }
    return { label: "In Stock", variant: "secondary" as const }
  }

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return product.name.toLowerCase().includes(query)
  })

  const handleQuickAdjust = (product: ProductStock, type: "add" | "subtract") => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setIsDialogOpen(true)
  }

  const handleEditPrice = (product: ProductStock, type: "cost" | "selling" | "wholesale") => {
    setSelectedProduct(product)
    setPriceEditType(type)
    const currentPrice = type === "cost" 
      ? product.cost_price 
      : type === "selling" 
      ? product.selling_price 
      : product.wholesale_price || 0
    setEditedPrice(currentPrice.toString())
    setPriceDialogOpen(true)
  }

  const handleEditName = (product: ProductStock) => {
    setSelectedProduct(product)
    setEditedName(product.name)
    setNameDialogOpen(true)
  }

  const handleSaveName = async () => {
    if (!selectedProduct) return

    const newName = editedName.trim()
    if (!newName) {
      alert("Product name cannot be empty")
      return
    }

    setIsSavingName(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .update({ name: newName })
        .eq("id", selectedProduct.id)

      if (error) throw error

      // Update local state
      setProducts(products.map(p => 
        p.id === selectedProduct.id 
          ? { ...p, name: newName }
          : p
      ))

      setNameDialogOpen(false)
      setSelectedProduct(null)
      setEditedName("")
      router.refresh()
      alert("Product name updated successfully!")
    } catch (error: any) {
      alert(`Error updating product name: ${error.message}`)
    } finally {
      setIsSavingName(false)
    }
  }

  const handleSavePrice = async () => {
    if (!selectedProduct) return

    const price = Number.parseFloat(editedPrice)
    if (isNaN(price) || price < 0) {
      alert("Please enter a valid price")
      return
    }

    setIsSavingPrice(true)
    try {
      const supabase = createClient()
      const updateData: any = {}
      
      if (priceEditType === "cost") {
        updateData.cost_price = price
      } else if (priceEditType === "selling") {
        updateData.selling_price = price
      } else {
        updateData.wholesale_price = price
      }

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", selectedProduct.id)

      if (error) throw error

      // Update local state
      setProducts(products.map(p => 
        p.id === selectedProduct.id 
          ? { ...p, ...updateData }
          : p
      ))

      setPriceDialogOpen(false)
      setSelectedProduct(null)
      setEditedPrice("")
      router.refresh()
      alert("Price updated successfully!")
    } catch (error: any) {
      alert(`Error updating price: ${error.message}`)
    } finally {
      setIsSavingPrice(false)
    }
  }

  const getPriceLabel = () => {
    switch (priceEditType) {
      case "cost": return "Buying Price"
      case "selling": return "Selling Price"
      case "wholesale": return "Wholesale Price"
    }
  }

  const handleDeleteClick = (product: ProductStock) => {
    setSelectedProduct(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct || !selectedStoreId) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      
      // Delete the product from the specific shop
      // Since products are store-specific (store_id), we can delete the entire product record
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id)
        .eq("store_id", selectedStoreId)

      if (error) throw error

      // Remove from local state
      setProducts(products.filter(p => p.id !== selectedProduct.id))
      
      setDeleteDialogOpen(false)
      setSelectedProduct(null)
      router.refresh()
      alert("Product deleted successfully!")
    } catch (error: any) {
      alert(`Error deleting product: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Don't show products until store is selected (for admins)
  if (canAccessAllStores && !selectedStoreId) {
    return (
      <>
        <LoadingDialog isOpen={isLoading} message="Loading products..." />
        <div className="mb-4 space-y-4" suppressHydrationWarning>
          <div className="space-y-2">
            <Label htmlFor="storeSelect">Select Shop *</Label>
            <Select value={selectedStoreId || ""} onValueChange={setSelectedStoreId}>
              <SelectTrigger id="storeSelect" className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a shop to view stock" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Please select a shop before viewing stock data</p>
          </div>
      </div>
      </>
    )
  }

  return (
    <>
      <LoadingDialog isOpen={isLoading} message="Loading products..." />
      <LoadingDialog isOpen={isSavingPrice} message="Saving price..." />
      <LoadingDialog isOpen={isSavingName} message="Saving product name..." />
      <LoadingDialog isOpen={isDeleting} message="Deleting product..." />
      <div className="mb-4 space-y-4" suppressHydrationWarning>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {(canAccessAllStores || stores.length > 0) && (
            <div className="space-y-2 min-w-[200px]">
              <Label htmlFor="storeSelect">Select Shop *</Label>
              <Select value={selectedStoreId || ""} onValueChange={setSelectedStoreId}>
                <SelectTrigger id="storeSelect" className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select a shop" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2 flex-1 max-w-sm">
            <Label htmlFor="search">Search Products</Label>
            <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
                id="search"
                placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
                disabled={!selectedStoreId}
          />
            </div>
          </div>
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        )}
      </div>

      {selectedStoreId && (
        <div className="relative" suppressHydrationWarning>
          <div 
            ref={tableContainerRef}
            className="rounded-md border overflow-x-auto" 
            suppressHydrationWarning
          >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Current Stock</TableHead>
                <TableHead>Buying Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Wholesale Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? `No products found matching "${searchQuery}"` : "No products found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                  const status = getStockStatus(product.stock_quantity)

                return (
                  <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{product.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditName(product)}
                            title="Edit product name"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>
                          {product.stock_quantity} {product.units?.short_name || ""}
                        </span>
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
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(product.cost_price, currency)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditPrice(product, "cost")}
                            title="Edit buying price"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(product.selling_price, currency)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditPrice(product, "selling")}
                            title="Edit selling price"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{product.wholesale_price ? formatCurrency(product.wholesale_price, currency) : "-"}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditPrice(product, "wholesale")}
                            title="Edit wholesale price"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/stock/history/${product.id}`}>
                          <History className="h-4 w-4 mr-2" />
                          History
                        </Link>
                      </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(product)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
          {/* Sticky horizontal scrollbar - always visible at bottom */}
          <div 
            ref={scrollbarRef}
            className="sticky bottom-0 left-0 right-0 h-[17px] overflow-x-auto overflow-y-hidden bg-background border-t z-10"
            suppressHydrationWarning
          >
            <div style={{ height: '1px', width: '200%' }}></div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <QuickStockAdjustDialog
          product={selectedProduct as any}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedProduct(null)
            if (selectedStoreId) {
              loadProducts(selectedStoreId)
            }
          }}
          adjustmentType={adjustmentType}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedProduct?.name}</strong> from this shop? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Name Edit Dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product Name</DialogTitle>
            <DialogDescription>
              Update the product name for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nameInput">Product Name</Label>
              <Input
                id="nameInput"
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter product name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSavingName) {
                    handleSaveName()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDialogOpen(false)} disabled={isSavingName}>
              Cancel
            </Button>
            <Button onClick={handleSaveName} disabled={isSavingName || !editedName.trim()}>
              {isSavingName ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Edit Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {getPriceLabel()}</DialogTitle>
            <DialogDescription>
              Update the {getPriceLabel().toLowerCase()} for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="priceInput">{getPriceLabel()}</Label>
              <Input
                id="priceInput"
                type="number"
                step="0.01"
                min="0"
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
                placeholder="Enter price"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)} disabled={isSavingPrice}>
              Cancel
            </Button>
            <Button onClick={handleSavePrice} disabled={isSavingPrice}>
              {isSavingPrice ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
