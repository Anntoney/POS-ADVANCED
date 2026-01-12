"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Check, X, Package, RefreshCw, Plus } from "lucide-react"
import Link from "next/link"
import type { StockTransfer, Store, Product } from "@/lib/types/database"

type StockTransferWithRelations = StockTransfer & {
  from_store: Store
  to_store: Store
  products: Product
  profiles: { full_name: string | null; email: string } | null
}

export function StockTransferLogs({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const [transfers, setTransfers] = useState<StockTransferWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userStoreId, setUserStoreId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadUserStore()
    loadTransfers()
  }, [])

  const loadUserStore = async () => {
    const supabase = createClient()
    const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", userId).single()
    setUserStoreId(profile?.store_id || null)
  }

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
      .order("created_at", { ascending: false })

    const { data, error } = await query

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

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("stock_transfers")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", transferId)

      if (error) throw error

      // Mark related notifications as read
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("related_id", transferId)
        .eq("user_id", userId)

      await loadTransfers()
      router.refresh()
      alert("Transfer completed successfully!")
    } catch (error: any) {
      alert(`Error completing transfer: ${error.message}`)
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

  if (isLoading) {
    return <div className="text-center py-8">Loading transfer logs...</div>
  }

  return (
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
        {transfers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No stock transfers found</div>
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
                {transfers.map((transfer) => (
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
                      {transfer.status === "pending" && (
                        <div className="flex justify-end gap-2">
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
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
