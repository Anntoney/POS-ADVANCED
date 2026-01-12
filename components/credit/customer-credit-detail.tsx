"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, ArrowLeft, ShoppingCart, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"
import type { Customer } from "@/lib/types/database"

interface SaleItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
}

interface Sale {
  id: string
  sale_number: string
  sale_date: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  amount_paid: number
  payment_status: string
  payment_method: string
  sale_items: SaleItem[]
}

interface Payment {
  id: string
  payment_number: string
  amount: number
  payment_method: string
  payment_date: string
  notes: string | null
}

export function CustomerCreditDetail({
  customer,
  sales,
  payments,
}: {
  customer: Customer
  sales: Sale[]
  payments: Payment[]
}) {
  const [currency, setCurrency] = useState<Currency | null>(null)
  const router = useRouter()

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  // Filter for sales with outstanding balance (pending, partial, or any sale with balance > 0)
  const creditSales = sales.filter((s) => {
    const status = s.payment_status?.toLowerCase()
    const hasBalance = Number(s.total_amount) - Number(s.amount_paid || 0) > 0
    return (status === "pending" || status === "partial" || status === "credit") || hasBalance
  })
  const totalCredit = creditSales.reduce((sum, s) => sum + Number(s.total_amount) - Number(s.amount_paid), 0)
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  const generateInvoicePDF = () => {
    const invoiceContent = generateInvoiceHTML()
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(invoiceContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const generateInvoiceHTML = () => {
    const today = new Date().toLocaleDateString()
    const currencySymbol = currency?.symbol || "$"

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Credit Invoice - ${customer.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              color: #000;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .customer-info {
              margin-bottom: 30px;
            }
            .customer-info h2 {
              font-size: 18px;
              margin-bottom: 10px;
              color: #000;
            }
            .customer-info p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #f5f5f5;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #333;
              font-weight: bold;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
            }
            .text-right {
              text-align: right;
            }
            .summary {
              margin-top: 30px;
              border-top: 2px solid #333;
              padding-top: 20px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 16px;
            }
            .summary-row.total {
              font-size: 20px;
              font-weight: bold;
              border-top: 2px solid #333;
              margin-top: 10px;
              padding-top: 15px;
            }
            .summary-row.balance {
              font-size: 22px;
              font-weight: bold;
              color: #dc2626;
              background-color: #fef2f2;
              padding: 15px;
              margin-top: 10px;
              border-radius: 5px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CREDIT STATEMENT</h1>
            <p>Date: ${today}</p>
            <p>Invoice for Outstanding Balance</p>
          </div>

          <div class="customer-info">
            <h2>Customer Information</h2>
            <p><strong>Name:</strong> ${customer.name}</p>
            ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ""}
            ${customer.phone ? `<p><strong>Phone:</strong> ${customer.phone}</p>` : ""}
            ${customer.address ? `<p><strong>Address:</strong> ${customer.address}</p>` : ""}
          </div>

          <h2>Items Purchased on Credit</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Sale #</th>
                <th>Product</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${creditSales
                .map(
                  (sale) => `
                ${sale.sale_items
                  .map(
                    (item) => `
                  <tr>
                    <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td>${sale.sale_number}</td>
                    <td>${item.product_name}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${currencySymbol}${Number(item.unit_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-right">${currencySymbol}${Number(item.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                `,
                  )
                  .join("")}
              `,
                )
                .join("")}
            </tbody>
          </table>

          ${
            payments.length > 0
              ? `
            <h2>Payment History</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payment #</th>
                  <th>Method</th>
                  <th class="text-right">Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${payments
                  .map(
                    (payment) => `
                  <tr>
                    <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td>${payment.payment_number}</td>
                    <td>${payment.payment_method}</td>
                    <td class="text-right">${currencySymbol}${Number(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${payment.notes || "-"}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : ""
          }

          <div class="summary">
            <div class="summary-row">
              <span>Total Credit Purchases:</span>
              <span><strong>${currencySymbol}${creditSales.reduce((sum, s) => sum + Number(s.total_amount), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            </div>
            <div class="summary-row">
              <span>Total Payments Made:</span>
              <span><strong>${currencySymbol}${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            </div>
            <div class="summary-row balance">
              <span>OUTSTANDING BALANCE:</span>
              <span>${currencySymbol}${Number(customer.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div class="footer">
            <p>This is a computer-generated statement and does not require a signature.</p>
            <p>Please contact us if you have any questions about this statement.</p>
          </div>
        </body>
      </html>
    `
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Credit Management
        </Button>
        <Button onClick={generateInvoicePDF}>
          <Download className="h-4 w-4 mr-2" />
          Download Invoice PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {currency
                ? formatCurrency(Number(customer.balance), currency)
                : `$${Number(customer.balance).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding debt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency
                ? formatCurrency(
                    creditSales.reduce((sum, s) => sum + Number(s.total_amount), 0),
                    currency,
                  )
                : `$${creditSales.reduce((sum, s) => sum + Number(s.total_amount), 0).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">{creditSales.length} credit sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currency ? formatCurrency(totalPaid, currency) : `$${totalPaid.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">{payments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Credit Sales</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit Sales History</CardTitle>
              <CardDescription>All purchases made on credit by this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {creditSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No credit sales found</div>
              ) : (
                <div className="space-y-6">
                  {creditSales.map((sale) => (
                    <div key={sale.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{sale.sale_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={sale.payment_status === "paid" ? "default" : "destructive"}>
                          {sale.payment_status}
                        </Badge>
                      </div>

                      {sale.sale_items && sale.sale_items.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">Unit Price</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sale.sale_items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">
                                  {currency
                                    ? formatCurrency(Number(item.unit_price), currency)
                                    : `$${Number(item.unit_price).toFixed(2)}`}
                                </TableCell>
                                <TableCell className="text-right">
                                  {currency
                                    ? formatCurrency(Number(item.total_amount), currency)
                                    : `$${Number(item.total_amount).toFixed(2)}`}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No items found for this sale
                        </div>
                      )}

                      <div className="border-t pt-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>
                            {currency
                              ? formatCurrency(Number(sale.subtotal), currency)
                              : `$${Number(sale.subtotal).toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>
                            {currency
                              ? formatCurrency(Number(sale.tax_amount), currency)
                              : `$${Number(sale.tax_amount).toFixed(2)}`}
                          </span>
                        </div>
                        {Number(sale.discount_amount) > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount:</span>
                            <span>
                              -
                              {currency
                                ? formatCurrency(Number(sale.discount_amount), currency)
                                : `$${Number(sale.discount_amount).toFixed(2)}`}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>
                            {currency
                              ? formatCurrency(Number(sale.total_amount), currency)
                              : `$${Number(sale.total_amount).toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Paid:</span>
                          <span>
                            {currency
                              ? formatCurrency(Number(sale.amount_paid), currency)
                              : `$${Number(sale.amount_paid).toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-red-600">
                          <span>Balance:</span>
                          <span>
                            {currency
                              ? formatCurrency(Number(sale.total_amount) - Number(sale.amount_paid), currency)
                              : `$${(Number(sale.total_amount) - Number(sale.amount_paid)).toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payments received from this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No payments recorded</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.payment_number}</TableCell>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {currency
                            ? formatCurrency(Number(payment.amount), currency)
                            : `$${Number(payment.amount).toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{payment.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
