"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, FileText, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Quotation, QuotationStatus } from "@/lib/types/database"

type QuotationWithCustomer = Quotation & {
  customers: { id: string; name: string } | null
  stores: { id: string; name: string } | null
}

export function QuotationsTable({ quotations, canAccessAllStores = false }: { quotations: QuotationWithCustomer[]; canAccessAllStores?: boolean }) {
  const [currency, setCurrency] = useState<Currency | null>(null)
  const router = useRouter()

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  const getStatusColor = (status: QuotationStatus) => {
    switch (status) {
      case "accepted":
        return "default"
      case "sent":
        return "secondary"
      case "rejected":
        return "destructive"
      case "expired":
        return "outline"
      case "pending":
      default:
        return "outline"
    }
  }

  const handleConvertToSale = async (quotationId: string) => {
    if (!confirm("Convert this quotation to a sale? This action cannot be undone.")) {
      return
    }

    try {
      const supabase = createClient()
      
      // Fetch quotation with items
      const { data: quotation, error: quotationError } = await supabase
        .from("quotations")
        .select(`
          *,
          quotation_items (*)
        `)
        .eq("id", quotationId)
        .single()

      if (quotationError) throw quotationError

      if (!quotation) {
        alert("Quotation not found")
        return
      }

      // Check if quotation is accepted
      if (quotation.status !== "accepted") {
        alert("Only accepted quotations can be converted to sales. Please update the quotation status first.")
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("You must be logged in")
        return
      }

      // Create sale from quotation
      const saleNumber = `SALE-${Date.now()}`
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          sale_number: saleNumber,
          customer_id: quotation.customer_id,
          sale_date: new Date().toISOString(),
          subtotal: quotation.subtotal,
          tax_amount: quotation.tax_amount,
          discount_amount: quotation.discount_amount,
          total_amount: quotation.total_amount,
          payment_method: "credit", // Default to credit, user can update later
          payment_status: "pending",
          amount_paid: 0,
          notes: `Converted from quotation ${quotation.quotation_number}`,
          store_id: quotation.store_id,
          created_by: user.id,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Create sale items from quotation items
      const quotationItems = (quotation as any).quotation_items || []
      if (quotationItems.length > 0) {
        for (const item of quotationItems) {
          const { error: itemError } = await supabase.from("sale_items").insert({
            sale_id: sale.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            discount_amount: item.discount_amount,
            total_amount: item.total_amount,
          })

          if (itemError) throw itemError

          // Update product stock if product_id exists
          if (item.product_id) {
            const { data: product } = await supabase
              .from("products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single()

            if (product) {
              const newStock = Number(product.stock_quantity) - item.quantity
              await supabase
                .from("products")
                .update({ stock_quantity: newStock })
                .eq("id", item.product_id)
            }
          }
        }
      }

      // Update quotation status to accepted (if not already)
      await supabase.from("quotations").update({ status: "accepted" }).eq("id", quotationId)

      alert(`Quotation converted to sale: ${saleNumber}`)
      router.push(`/dashboard/sales/${sale.id}`)
      router.refresh()
    } catch (error: unknown) {
      alert(`Error converting quotation: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No quotations found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/quotations/new">
            <FileText className="mr-2 h-4 w-4" />
            Create your first quotation
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quotation Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Expiry Date</TableHead>
            {canAccessAllStores && <TableHead>Store</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quotation) => (
            <TableRow key={quotation.id}>
              <TableCell className="font-medium">{quotation.quotation_number}</TableCell>
              <TableCell>{quotation.customers?.name || "Walk-in"}</TableCell>
              <TableCell>{new Date(quotation.quotation_date).toLocaleDateString()}</TableCell>
              <TableCell>
                {quotation.expiry_date ? new Date(quotation.expiry_date).toLocaleDateString() : "-"}
              </TableCell>
              {canAccessAllStores && (
                <TableCell>
                  <Badge variant="outline">{quotation.stores?.name || "No Store"}</Badge>
                </TableCell>
              )}
              <TableCell>
                <Badge variant={getStatusColor(quotation.status)} className="capitalize">
                  {quotation.status}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold">
                {currency
                  ? formatCurrency(Number(quotation.total_amount), currency)
                  : `$${Number(quotation.total_amount).toFixed(2)}`}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/dashboard/quotations/${quotation.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {quotation.status === "accepted" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleConvertToSale(quotation.id)}
                      title="Convert to Sale"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
