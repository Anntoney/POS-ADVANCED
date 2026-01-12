import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { getDefaultCurrencyServer } from "@/lib/utils/currency-server"
import { formatCurrency } from "@/lib/utils/currency"
import { getUserStoreContext } from "@/lib/utils/store-context"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const storeContext = await getUserStoreContext(user.id)

  const { data: quotation } = await supabase
    .from("quotations")
    .select(`
      *,
      customers:customer_id (id, name, email, phone),
      stores:store_id (id, name)
    `)
    .eq("id", id)
    .single()

  if (!quotation) {
    notFound()
  }

  // Check if user has permission to view this quotation
  if (!storeContext.canAccessAllStores && quotation.store_id !== storeContext.storeId) {
    notFound() // Return 404 if trying to access quotation from another store
  }

  const { data: items } = await supabase.from("quotation_items").select("*").eq("quotation_id", id).order("created_at")

  const currency = await getDefaultCurrencyServer()

  const getStatusColor = (status: string) => {
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

  return (
    <PermissionGuard feature="quotations">
      <div>
        <Header title="Quotation Details" />
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/quotations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">{quotation.quotation_number}</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quotation Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quotation Number:</span>
                  <span className="font-medium">{quotation.quotation_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(quotation.quotation_date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expiry Date:</span>
                  <span>{quotation.expiry_date ? new Date(quotation.expiry_date).toLocaleDateString() : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={getStatusColor(quotation.status)} className="capitalize">
                    {quotation.status}
                  </Badge>
                </div>
                {storeContext.canAccessAllStores && quotation.stores && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Store:</span>
                    <span className="font-medium">{quotation.stores.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {quotation.customers ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{quotation.customers.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{quotation.customers.email || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{quotation.customers.phone || "-"}</span>
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
              <CardTitle>Quotation Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items && items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(Number(item.unit_price), currency)}</TableCell>
                        <TableCell>{Number(item.tax_rate || 0).toFixed(2)}%</TableCell>
                        <TableCell>{formatCurrency(Number(item.tax_amount || 0), currency)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(item.total_amount), currency)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No items in this quotation
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {items && items.length > 0 && (
                <div className="mt-6 space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(Number(quotation.subtotal), currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>{formatCurrency(Number(quotation.tax_amount), currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span>-{formatCurrency(Number(quotation.discount_amount), currency)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(Number(quotation.total_amount), currency)}</span>
                  </div>
                </div>
              )}

              {quotation.notes && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Notes:</p>
                  <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  )
}
