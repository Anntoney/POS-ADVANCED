import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getDefaultCurrencyServer } from "@/lib/utils/currency-server"
import { formatCurrency } from "@/lib/utils/currency"

export default async function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: returnRecord } = await supabase
    .from("sale_returns")
    .select(`
      *,
      sales (
        sale_number,
        customers (name, email, phone)
      )
    `)
    .eq("id", id)
    .single()

  if (!returnRecord) {
    notFound()
  }

  const { data: items } = await supabase.from("sale_return_items").select("*").eq("sale_return_id", id)

  const currency = await getDefaultCurrencyServer()

  return (
    <div>
      <Header title="Return Details" />
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Return Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return Number:</span>
                <span className="font-medium">{returnRecord.return_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(returnRecord.return_date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Sale:</span>
                <span className="font-medium">{returnRecord.sales?.sale_number || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refund Method:</span>
                <span className="capitalize">{returnRecord.refund_method?.replace("_", " ") || "-"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {returnRecord.sales?.customers ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{returnRecord.sales.customers.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{returnRecord.sales.customers.email || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{returnRecord.sales.customers.phone || "-"}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Walk-in Customer</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Returned Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(Number(item.unit_price), currency)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(item.total_amount), currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Return Amount:</span>
                <span>{formatCurrency(Number(returnRecord.total_amount), currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {returnRecord.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{returnRecord.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
