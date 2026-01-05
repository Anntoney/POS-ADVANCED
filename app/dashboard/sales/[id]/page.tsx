import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getDefaultCurrencyServer } from "@/lib/utils/currency-server"
import { formatCurrency } from "@/lib/utils/currency"

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sale } = await supabase
    .from("sales")
    .select(`
      *,
      customers (name, email, phone)
    `)
    .eq("id", id)
    .single()

  if (!sale) {
    notFound()
  }

  const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", id)

  const { data: salePayments } = await supabase
    .from("sale_payments")
    .select("*")
    .eq("sale_id", id)
    .order("created_at", { ascending: true })

  const currency = await getDefaultCurrencyServer()

  return (
    <div>
      <Header title="Sale Details" />
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sale Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sale Number:</span>
                <span className="font-medium">{sale.sale_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(sale.sale_date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={sale.payment_status === "paid" ? "default" : "secondary"} className="capitalize">
                  {sale.payment_status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-medium">{formatCurrency(Number(sale.amount_paid || 0), currency)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sale.customers ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{sale.customers.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{sale.customers.email || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{sale.customers.phone || "-"}</span>
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
            <CardTitle>Sale Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(Number(item.unit_price), currency)}</TableCell>
                    <TableCell>{formatCurrency(Number(item.tax_amount), currency)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(item.total_amount), currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(Number(sale.subtotal), currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{formatCurrency(Number(sale.tax_amount), currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-{formatCurrency(Number(sale.discount_amount), currency)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(Number(sale.total_amount), currency)}</span>
              </div>
              {Number(sale.total_amount) - Number(sale.amount_paid || 0) > 0 && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Balance:</span>
                  <span className="font-medium">
                    {formatCurrency(Number(sale.total_amount) - Number(sale.amount_paid || 0), currency)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {salePayments && salePayments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salePayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="capitalize">{payment.payment_method.replace("_", " ")}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(payment.amount), currency)}</TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Paid:</span>
                  <span>
                    {formatCurrency(
                      salePayments.reduce((sum, p) => sum + Number(p.amount), 0),
                      currency,
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
