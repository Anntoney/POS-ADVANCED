"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Check, X, Package, RefreshCw, Plus, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import type { StockTransfer, Store, Product } from "@/lib/types/database"

type StockTransferWithRelations = StockTransfer & {
  from_store: Store
  to_store: Store
  products: Product
  profiles: { full_name: string | null; email: string } | null
}

export function StockTransferLogs({ 
  userId, 
  isAdmin,
  userStoreId,
  canAccessAllStores
}: { 
  userId: string; 
  isAdmin: boolean;
  userStoreId: string | null;
  canAccessAllStores: boolean;
}) {
  const [transfers, setTransfers] = useState<StockTransferWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadTransfers()
  }, [])

  const loadTransfers = async () => {
    setIsLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("stock_transfers")
      .select(
        `
        *,
        from_store:stores!stock_transfers_from_store_id_fkey(id, name),
        to_store:stores!stock_transfers_to_store_id_fkey(id, name),
        products(id, name, sku),
        profiles(id, full_name, email)
      `,
      )

    // Filter transfers by store - users can only see transfers from/to their store unless admin
    if (!canAccessAllStores && userStoreId) {
      query = query.or(`from_store_id.eq.${userStoreId},to_store_id.eq.${userStoreId}`)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading transfers:", error)
    } else {
      setTransfers((data as any) || [])
    }
    setIsLoading(false)
  }

  const handleCompleteTransfer = async (transferId: string) => {
    if (!confirm("Are you sure you want to complete this transfer? This will move the stock between stores.")) {
      return
    }

    setIsCompleting(true)
    try {
      const supabase = createClient()

      // First, fetch the transfer details
      const { data: transfer, error: fetchError } = await supabase
        .from("stock_transfers")
        .select("*")
        .eq("id", transferId)
        .single()

      if (fetchError) throw fetchError
      if (!transfer) throw new Error("Transfer not found")

      // Fetch the source product from the source store
      const { data: sourceProduct, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", transfer.product_id)
        .eq("store_id", transfer.from_store_id)
        .single()

      if (productError) throw productError
      if (!sourceProduct) throw new Error("Source product not found in source store")

      // Create a clean product object without system fields to avoid duplicate key errors
      // Extract and exclude: id, store_id, created_at, updated_at
      const {
        id: _sourceProductId,
        store_id: _sourceStoreId,
        created_at: _createdAt,
        updated_at: _updatedAt,
        ...cleanProductData
      } = sourceProduct as any

      // Verify source store has enough stock
      if (sourceProduct.stock_quantity < transfer.quantity) {
        const errorMsg = `Cannot complete transfer: Insufficient stock.\n\n` +
          `Available: ${sourceProduct.stock_quantity} units\n` +
          `Required: ${transfer.quantity} units\n\n` +
          `The stock may have been sold or used in another transfer since this transfer was created.\n\n` +
          `Please cancel this transfer or contact the source store to restock.`
        throw new Error(errorMsg)
      }

      // Check if product exists in destination store (by name or SKU)
      // First check by name
      const { data: productsByName } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity")
        .eq("store_id", transfer.to_store_id)
        .eq("name", sourceProduct.name)

      // Then check by SKU
      const { data: productsBySku } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity")
        .eq("store_id", transfer.to_store_id)
        .eq("sku", sourceProduct.sku)

      // Combine results, preferring name match
      const existingProducts = productsByName && productsByName.length > 0 
        ? productsByName 
        : (productsBySku && productsBySku.length > 0 ? productsBySku : [])

      let destinationProductId: string

      if (existingProducts && existingProducts.length > 0) {
        // Product exists in destination store - update quantity
        // Prefer matching by name, then by SKU
        const existingProduct = existingProducts.find((p: any) => p.name === sourceProduct.name) || existingProducts[0]
        destinationProductId = existingProduct.id

        const { error: updateError } = await supabase
          .from("products")
          .update({
            stock_quantity: (existingProduct.stock_quantity || 0) + transfer.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProduct.id)
          .eq("store_id", transfer.to_store_id)

        if (updateError) throw updateError
      } else {
        // Product doesn't exist in destination store - create it
        // Generate unique SKU if needed
        let newSku = sourceProduct.sku
        const { data: skuCheck } = await supabase
          .from("products")
          .select("id")
          .eq("sku", newSku)
          .single()

        if (skuCheck) {
          // SKU already exists globally, generate a unique one
          newSku = `${sourceProduct.sku}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }

        // Generate unique barcode if needed
        let newBarcode = sourceProduct.barcode
        if (newBarcode) {
          const { data: barcodeCheck } = await supabase
            .from("products")
            .select("id")
            .eq("barcode", newBarcode)
            .single()

          if (barcodeCheck) {
            newBarcode = null // Set to null if duplicate
          }
        }

        // Create new product in destination store
        // Use clean product data (without id, store_id, timestamps) and add new values
        const productData: any = {
          ...cleanProductData,
          sku: newSku,
          barcode: newBarcode,
          stock_quantity: transfer.quantity,
          store_id: transfer.to_store_id,
          // created_by will be from cleanProductData, but we can override if needed
        }
        
        // Explicitly exclude id, created_at, updated_at to ensure new UUID is generated
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single()

        if (insertError) {
          // If still duplicate key error, try with completely unique SKU
          if (insertError.message?.includes("sku") || insertError.message?.includes("duplicate") || insertError.message?.includes("unique")) {
            const uniqueSku = `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
            const retryProductData: any = {
              ...cleanProductData,
              sku: uniqueSku,
              barcode: null, // Set barcode to null to avoid conflicts
              stock_quantity: transfer.quantity,
              store_id: transfer.to_store_id,
            }
            // Explicitly exclude id, created_at, updated_at to ensure new UUID is generated
            const { data: retryProduct, error: retryError } = await supabase
              .from("products")
              .insert(retryProductData)
              .select("id")
              .single()

            if (retryError) throw retryError
            destinationProductId = retryProduct.id
          } else {
            throw insertError
          }
        } else {
          destinationProductId = newProduct.id
        }
      }

      // Deduct stock from source store
      const { error: deductError } = await supabase
        .from("products")
        .update({
          stock_quantity: sourceProduct.stock_quantity - transfer.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sourceProduct.id)
        .eq("store_id", transfer.from_store_id)

      if (deductError) {
        console.error("Error deducting stock:", deductError)
        throw new Error(`Failed to deduct stock from source store: ${deductError.message}`)
      }

      // Update transfer status to completed (this will hide action buttons)
      const { error: statusError } = await supabase
        .from("stock_transfers")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", transferId)

      if (statusError) {
        console.error("Error updating transfer status:", statusError)
        throw new Error(`Failed to update transfer status: ${statusError.message}`)
      }

      // Mark related notifications as read
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("related_id", transferId)
        .eq("user_id", userId)

      // Reload transfers to reflect the completed status (action buttons will be hidden)
      await loadTransfers()
      router.refresh()
      alert("Transfer completed successfully! Stock has been moved between stores.")
    } catch (error: any) {
      console.error("Error completing transfer:", error)
      alert(`Error completing transfer: ${error.message || "An unexpected error occurred"}`)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleCancelTransfer = async (transferId: string) => {
    if (!confirm("Are you sure you want to cancel this transfer?")) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("stock_transfers")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", transferId)

      if (error) throw error

      await loadTransfers()
      router.refresh()
    } catch (error: any) {
      alert(`Error cancelling transfer: ${error.message}`)
    }
  }

  const handleDeleteTransfer = async (transferId: string) => {
    if (!confirm("Are you sure you want to delete this transfer log? This action cannot be undone.")) {
      return
    }

    try {
      const supabase = createClient()
      const { error, data } = await supabase
        .from("stock_transfers")
        .delete()
        .eq("id", transferId)
        .select()

      if (error) {
        console.error("Delete error:", error)
        throw error
      }

      // Remove from local state immediately for better UX
      setTransfers((prev) => prev.filter((t) => t.id !== transferId))
      
      // Reload to ensure consistency
      await loadTransfers()
      router.refresh()
    } catch (error: any) {
      console.error("Error deleting transfer:", error)
      // Reload on error to show actual state
      await loadTransfers()
      alert(`Error deleting transfer: ${error.message || "An unexpected error occurred. You may need admin permissions."}`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  // Filter transfers based on search term
  const filteredTransfers = transfers.filter((transfer) => {
    if (!searchTerm.trim()) return true
    const searchLower = searchTerm.toLowerCase()
    const productName = ((transfer.products as any)?.name || "").toLowerCase()
    const productSku = ((transfer.products as any)?.sku || "").toLowerCase()
    const transferNumber = (transfer.transfer_number || "").toLowerCase()
    const fromStoreName = ((transfer.from_store as any)?.name || "").toLowerCase()
    const toStoreName = ((transfer.to_store as any)?.name || "").toLowerCase()
    const createdBy = (transfer.profiles?.full_name || transfer.profiles?.email || "").toLowerCase()

    return (
      productName.includes(searchLower) ||
      productSku.includes(searchLower) ||
      transferNumber.includes(searchLower) ||
      fromStoreName.includes(searchLower) ||
      toStoreName.includes(searchLower) ||
      createdBy.includes(searchLower)
    )
  })

  return (
    <>
      <LoadingDialog isOpen={isLoading} message="Loading transfer logs..." />
      <LoadingDialog isOpen={isCompleting} message="Completing stock transfer..." />
      {!isLoading && (
      <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Transfer Logs
            </CardTitle>
            <CardDescription>View and manage stock transfers between stores</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/stock/transfer">
                <Plus className="h-4 w-4 mr-2" />
                Create Transfer
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={loadTransfers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, SKU, transfer #, store, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredTransfers.length} of {transfers.length} transfers
            </p>
          )}
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No stock transfers found</div>
        ) : filteredTransfers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transfers found matching "{searchTerm}"
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer #</TableHead>
                  <TableHead>From Store</TableHead>
                  <TableHead>To Store</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">{transfer.transfer_number}</TableCell>
                    <TableCell>{(transfer.from_store as any)?.name || "—"}</TableCell>
                    <TableCell>{(transfer.to_store as any)?.name || "—"}</TableCell>
                    <TableCell>
                      {(transfer.products as any)?.name || "—"}
                      {(transfer.products as any)?.sku && (
                        <span className="text-xs text-muted-foreground ml-2">({(transfer.products as any).sku})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{transfer.quantity}</TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell>
                      {transfer.profiles?.full_name || transfer.profiles?.email || "—"}
                    </TableCell>
                    <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {transfer.status === "pending" && (
                          <>
                            {/* Allow receiving store users or admins to complete */}
                            {(isAdmin || (userStoreId && (transfer.to_store as any)?.id === userStoreId)) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCompleteTransfer(transfer.id)}
                                title="Confirm Receipt"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {/* Only admins can cancel */}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancelTransfer(transfer.id)}
                                title="Cancel Transfer"
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </>
                        )}
                        {/* Only admins can delete any transfer log */}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTransfer(transfer.id)}
                            title="Delete Transfer Log"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
      )}
    </>
  )
}
