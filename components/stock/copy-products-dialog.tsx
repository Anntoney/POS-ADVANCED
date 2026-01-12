"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

type Store = {
  id: string
  name: string
  is_active: boolean
}

interface CopyProductsDialogProps {
  stores: Store[]
  isOpen: boolean
  onClose: () => void
  userId: string
}

type CopyMode = "with_stock" | "zero_stock"

export function CopyProductsDialog({ stores, isOpen, onClose, userId }: CopyProductsDialogProps) {
  const [fromStoreId, setFromStoreId] = useState<string>("")
  const [toStoreId, setToStoreId] = useState<string>("")
  const [copyMode, setCopyMode] = useState<CopyMode>("with_stock")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCopying, setIsCopying] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const router = useRouter()

  const activeStores = stores.filter((s) => s.is_active)

  const handleCopy = async () => {
    if (!fromStoreId || !toStoreId) {
      setError("Please select both source and destination stores")
      return
    }

    if (fromStoreId === toStoreId) {
      setError("Source and destination stores must be different")
      return
    }

    setIsCopying(true)
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Fetch all products from source store
      const { data: sourceProducts, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", fromStoreId)
        .eq("is_active", true)

      if (fetchError) throw fetchError

      if (!sourceProducts || sourceProducts.length === 0) {
        setError("No products found in the source store")
        setIsLoading(false)
        setIsCopying(false)
        return
      }

      // Check which products already exist in destination store (by name for skipping duplicates)
      const { data: existingProducts, error: existingError } = await supabase
        .from("products")
        .select("id, name, sku, barcode")
        .eq("store_id", toStoreId)

      if (existingError) throw existingError

      // Get all existing SKUs and barcodes from ALL stores (they must be globally unique)
      // Exclude products from source store since we're copying FROM there
      const { data: allProducts, error: allProductsError } = await supabase
        .from("products")
        .select("sku, barcode, store_id")

      if (allProductsError) throw allProductsError

      // Build sets of existing SKUs/barcodes, excluding source store products
      const allSkus = new Set<string>()
      const allBarcodes = new Set<string>()
      allProducts?.forEach((p) => {
        // Only include SKUs/barcodes from stores OTHER than the source store
        if (p.store_id !== fromStoreId) {
          if (p.sku) allSkus.add(p.sku)
          if (p.barcode) allBarcodes.add(p.barcode)
        }
      })

      const existingNames = new Set(existingProducts?.map((p) => p.name.toLowerCase()) || [])

      // Filter out products that already exist in destination store (by name)
      const productsToCopy = sourceProducts.filter((product) => {
        const hasMatchingName = existingNames.has(product.name.toLowerCase())
        return !hasMatchingName
      })

      if (productsToCopy.length === 0) {
        setError("All products from the source store already exist in the destination store (by name)")
        setIsLoading(false)
        setIsCopying(false)
        return
      }

      setProgress({ current: 0, total: productsToCopy.length })

      // Copy products one by one to better handle errors and generate unique SKUs/barcodes
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      // Track SKUs and barcodes we've already used in this copy operation
      const usedSkusInThisCopy = new Set<string>()
      const usedBarcodesInThisCopy = new Set<string>()

      for (let i = 0; i < productsToCopy.length; i++) {
        const product = productsToCopy[i]
        
        // Generate unique SKU - check both existing DB SKUs and SKUs we've used in this copy
        let newSku = product.sku
        if (newSku && (allSkus.has(newSku) || usedSkusInThisCopy.has(newSku))) {
          let skuCounter = 1
          let baseSku = newSku.replace(/-COPY-\d+$/, "").replace(/-\d{13,}-\d+$/, "") // Remove existing -COPY-X or timestamp suffixes
          let candidateSku = ""
          do {
            candidateSku = `${baseSku}-COPY-${skuCounter}`
            skuCounter++
          } while ((allSkus.has(candidateSku) || usedSkusInThisCopy.has(candidateSku)) && skuCounter < 10000)
          
          if (skuCounter >= 10000) {
            // Fallback: use timestamp-based SKU
            candidateSku = `${baseSku || "SKU"}-${Date.now()}-${i}`
          }
          newSku = candidateSku
          usedSkusInThisCopy.add(newSku)
        } else if (newSku) {
          // SKU is unique, track it for this copy operation
          usedSkusInThisCopy.add(newSku)
        }

        // Generate unique barcode - check both existing DB barcodes and barcodes we've used in this copy
        let newBarcode = product.barcode
        if (newBarcode && (allBarcodes.has(newBarcode) || usedBarcodesInThisCopy.has(newBarcode))) {
          newBarcode = null // Set to null if barcode conflicts, as it must be unique
        } else if (newBarcode) {
          // Barcode is unique, track it for this copy operation
          usedBarcodesInThisCopy.add(newBarcode)
        }

        const productToInsert = {
          name: product.name,
          sku: newSku || null,
          barcode: newBarcode,
          category_id: product.category_id || null,
          unit_id: product.unit_id || null,
          description: product.description || null,
          cost_price: Number(product.cost_price) || 0,
          selling_price: Number(product.selling_price) || 0,
          wholesale_price: product.wholesale_price ? Number(product.wholesale_price) : null,
          stock_quantity: copyMode === "with_stock" ? Number(product.stock_quantity) || 0 : 0,
          min_stock_level: Number(product.min_stock_level) || 0,
          tax_rate: Number(product.tax_rate) || 0,
          is_active: true,
          store_id: toStoreId,
          created_by: userId,
        }

        const { error: insertError } = await supabase.from("products").insert(productToInsert)

        if (insertError) {
          const errorMessage = insertError.message || JSON.stringify(insertError, null, 2)
          console.error(`Error inserting product "${product.name}" (SKU: ${newSku || "none"}):`, errorMessage, insertError)
          
          // If it's a duplicate SKU error, try one more time with a guaranteed unique SKU
          if (errorMessage.includes("sku_key") || errorMessage.includes("unique constraint") || errorMessage.includes("duplicate key")) {
            // Generate a completely unique SKU using timestamp
            const uniqueSku = `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`
            productToInsert.sku = uniqueSku
            
            const { error: retryError } = await supabase.from("products").insert(productToInsert)
            if (retryError) {
              errors.push(`${product.name}: ${retryError.message || errorMessage}`)
              errorCount++
            } else {
              successCount++
              allSkus.add(uniqueSku) // Track the new SKU
            }
          } else {
            errors.push(`${product.name}: ${errorMessage}`)
            errorCount++
          }
        } else {
          successCount++
          // Product added successfully - add to our tracking sets for future checks
          if (newSku) allSkus.add(newSku)
          if (newBarcode) allBarcodes.add(newBarcode)
        }

        setProgress({ current: i + 1, total: productsToCopy.length })
      }

      if (errorCount > 0) {
        const errorDetails = errors.slice(0, 5).join("\n")
        const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ""
        setError(
          `Copied ${successCount} product(s) successfully. ${errorCount} product(s) failed to copy.\n\nErrors:\n${errorDetails}${moreErrors}`,
        )
      } else {
        alert(`Successfully copied ${successCount} product(s) from source store to destination store!`)
        onClose()
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || "Failed to copy products")
    } finally {
      setIsLoading(false)
      setIsCopying(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  const handleClose = () => {
    if (!isCopying) {
      setFromStoreId("")
      setToStoreId("")
      setCopyMode("with_stock")
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Copy All Products Between Stores</DialogTitle>
          <DialogDescription>Copy all products from one store to another. Existing products (by SKU or name) will be skipped.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="from-store">Source Store (Copy From) *</Label>
            <Select value={fromStoreId} onValueChange={setFromStoreId} disabled={isCopying}>
              <SelectTrigger id="from-store">
                <SelectValue placeholder="Select source store" />
              </SelectTrigger>
              <SelectContent>
                {activeStores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-store">Destination Store (Copy To) *</Label>
            <Select value={toStoreId} onValueChange={setToStoreId} disabled={isCopying}>
              <SelectTrigger id="to-store">
                <SelectValue placeholder="Select destination store" />
              </SelectTrigger>
              <SelectContent>
                {activeStores.map((store) => (
                  <SelectItem key={store.id} value={store.id} disabled={store.id === fromStoreId}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Copy Mode *</Label>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setCopyMode("with_stock")}
                disabled={isCopying}
                className={`p-4 border-2 rounded-md text-left transition-colors ${
                  copyMode === "with_stock"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${isCopying ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                    copyMode === "with_stock" ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {copyMode === "with_stock" && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Copy with same prices and stock quantities</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Products will be copied with their current stock levels and prices
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCopyMode("zero_stock")}
                disabled={isCopying}
                className={`p-4 border-2 rounded-md text-left transition-colors ${
                  copyMode === "zero_stock"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${isCopying ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                    copyMode === "zero_stock" ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {copyMode === "zero_stock" && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Copy with same prices but stock = 0</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Products will be copied with their prices but all stock quantities will be set to 0
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {isCopying && (
            <div className="space-y-2 p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span>Copying products...</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4 justify-end pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCopying}>
              Cancel
            </Button>
            <Button onClick={handleCopy} disabled={isLoading || isCopying || !fromStoreId || !toStoreId}>
              {isCopying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Copying...
                </>
              ) : (
                "Copy Products"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
