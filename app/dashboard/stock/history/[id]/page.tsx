import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ArrowDown, ArrowUp } from "lucide-react"

export default async function StockHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("id, name, sku, stock_quantity, units (short_name)")
    .eq("id", id)
    .single()

  if (!product) {
    notFound()
  }

  const { data: adjustments } = await supabase
    .from("stock_adjustments")
    .select(
      `
      *,
      profiles (full_name)
    `,
    )
    .eq("product_id", id)
    .order("created_at", { ascending: false })

  const formatAdjustmentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <div>
      <Header title="Stock History" />
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>
              SKU: {product.sku} | Current Stock: {product.stock_quantity} {product.units?.short_name || ""}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adjustment History</CardTitle>
            <CardDescription>All stock adjustments for this product</CardDescription>
          </CardHeader>
          <CardContent>
            {!adjustments || adjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stock adjustments found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell>{new Date(adjustment.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatAdjustmentType(adjustment.adjustment_type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {adjustment.adjustment_type === "addition" ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          )}
                          {adjustment.quantity}
                        </div>
                      </TableCell>
                      <TableCell>{adjustment.reason || "-"}</TableCell>
                      <TableCell>{adjustment.profiles?.full_name || "Unknown"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
