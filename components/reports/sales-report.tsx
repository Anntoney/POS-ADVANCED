"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Filter, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type SalesReportData = {
  product_name: string
  product_id: string
  total_quantity: number
  total_amount: number
  payment_methods: string[]
}

type PaymentMethodSummary = {
  method: string
  total: number
}

export function SalesReport() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1) // First day of current month
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [storeFilter, setStoreFilter] = useState<string>("all")
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([])
  const [reportData, setReportData] = useState<SalesReportData[]>([])
  const [paymentSummaries, setPaymentSummaries] = useState<PaymentMethodSummary[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [totalGross, setTotalGross] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
    // Load stores
    const supabase = createClient()
    supabase
      .from("stores")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) {
          setStores(data as Array<{ id: string; name: string }>)
        }
      })
  }, [])

  const fetchReportData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Build query for sales in date range - include payment_status to filter credit sales
      let salesQuery = supabase
        .from("sales")
        .select("id, sale_date, total_amount, subtotal, store_id, payment_status, amount_paid")
        .gte("sale_date", `${startDate}T00:00:00`)
        .lte("sale_date", `${endDate}T23:59:59`)

      // Filter by store if specified
      if (storeFilter !== "all") {
        salesQuery = salesQuery.eq("store_id", storeFilter)
      }

      const { data: sales, error: salesError } = await salesQuery

      if (salesError) throw salesError

      if (!sales || sales.length === 0) {
        setReportData([])
        setPaymentSummaries([])
        setTotalSales(0)
        setTotalGross(0)
        setTotalExpenses(0)
        setIsLoading(false)
        return
      }

      // Get sale IDs
      const saleIds = sales.map((s) => s.id)

      // Fetch sale payments for sales made in the date range
      const { data: salePayments, error: paymentsError } = await supabase
        .from("sale_payments")
        .select("sale_id, payment_method, amount")
        .in("sale_id", saleIds)

      if (paymentsError) throw paymentsError

      // Fetch credit payments (customer_payments) made in the date range
      // These are payments toward existing credit balances
      const { data: creditPayments, error: creditPaymentsError } = await supabase
        .from("customer_payments")
        .select("payment_method, amount, payment_date")
        .gte("payment_date", `${startDate}T00:00:00`)
        .lte("payment_date", `${endDate}T23:59:59`)

      if (creditPaymentsError) throw creditPaymentsError

      // Fetch expenses in the date range
      let expensesQuery = supabase
        .from("expenses")
        .select("amount, payment_method, expense_date")
        .gte("expense_date", `${startDate}T00:00:00`)
        .lte("expense_date", `${endDate}T23:59:59`)

      if (storeFilter !== "all") {
        expensesQuery = expensesQuery.eq("store_id", storeFilter)
      }

      const { data: expenses, error: expensesError } = await expensesQuery
      if (expensesError) throw expensesError

      // Filter out unpaid credit sales from totals (only include fully paid credit sales)
      // Credit sales with payment_status "pending" or "partial" should not be counted until fully paid
      const paidSales = sales.filter((sale) => {
        // Exclude unpaid credit sales - only count if fully paid (payment_status = "paid")
        if (sale.payment_status === "pending" || (sale.payment_status === "partial" && Number(sale.amount_paid || 0) < Number(sale.total_amount))) {
          return false // Don't count unpaid/partially paid credit sales
        }
        return true
      })

      // Filter by payment method if specified (on paid sales only)
      let filteredSaleIds = paidSales.map((s) => s.id)
      if (paymentFilter !== "all") {
        const salesWithPaymentMethod = new Set(
          salePayments?.filter((p) => p.payment_method === paymentFilter).map((p) => p.sale_id) || [],
        )
        filteredSaleIds = paidSales.filter((s) => salesWithPaymentMethod.has(s.id)).map((s) => s.id)
      }

      // Calculate expenses first (they should always be shown if present)
      const totalExpensesCalc = expenses?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0

      // Fetch sale items for filtered sales with unit_price
      let saleItems: any[] = []
      if (filteredSaleIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from("sale_items")
          .select("sale_id, product_id, product_name, quantity, total_amount, unit_price")
          .in("sale_id", filteredSaleIds)

        if (itemsError) throw itemsError
        saleItems = data || []
      }

      // Get unique product IDs to fetch cost prices
      const productIds = [...new Set(saleItems?.map(item => item.product_id).filter(Boolean) || [])]
      
      // Fetch products with cost_price for profit calculation
      let productsWithCost: Array<{ id: string; cost_price: number }> = []
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("id, cost_price")
          .in("id", productIds)
        
        if (productsError) throw productsError
        productsWithCost = products || []
      }

      // Create a map for quick cost price lookup
      const costPriceMap = new Map<string, number>()
      productsWithCost.forEach(product => {
        costPriceMap.set(product.id, Number(product.cost_price || 0))
      })

      // Process data
      const productMap = new Map<string, SalesReportData>()
      const paymentMap = new Map<string, number>()

      // Group by product - only for fully paid sales
      saleItems?.forEach((item) => {
        const sale = paidSales.find((s) => s.id === item.sale_id)
        if (!sale) return // Skip items from unpaid credit sales

        const key = item.product_id || item.product_name
        const existing = productMap.get(key)

        if (existing) {
          existing.total_quantity += item.quantity
          existing.total_amount += Number(item.total_amount)
        } else {
          productMap.set(key, {
            product_name: item.product_name,
            product_id: item.product_id || "",
            total_quantity: item.quantity,
            total_amount: Number(item.total_amount),
            payment_methods: [],
          })
        }
      })

      // Build payment summaries from paid sales only (exclude unpaid credit sales)
      salePayments
        ?.filter((p) => filteredSaleIds.includes(p.sale_id))
        .forEach((p) => {
          const currentTotal = paymentMap.get(p.payment_method) || 0
          paymentMap.set(p.payment_method, currentTotal + Number(p.amount))
        })

      // Add credit payments (debt clearance) - count under their payment method AND separately
      let totalCreditPayments = 0
      creditPayments?.forEach((cp) => {
        const method = cp.payment_method || "cash"
        // Add to the payment method used (cash, mobile_money, etc.)
        const currentTotal = paymentMap.get(method) || 0
        paymentMap.set(method, currentTotal + Number(cp.amount))
        
        // Also track total for separate "Credit Payments" line item
        totalCreditPayments += Number(cp.amount)
      })

      // Add separate line for credit payments/debt clearance if any
      if (totalCreditPayments > 0) {
        paymentMap.set("debt_clearance", totalCreditPayments)
      }

      // Add payment methods to each product (for display purposes only)
      productMap.forEach((product) => {
        const productSales = saleItems
          ?.filter((item) => (item.product_id || item.product_name) === (product.product_id || product.product_name))
          .map((item) => item.sale_id) || []

        const methods = new Set<string>()
        salePayments
          ?.filter((p) => productSales.includes(p.sale_id))
          .forEach((p) => {
            methods.add(p.payment_method)
          })
        product.payment_methods = Array.from(methods)
      })

      // Calculate totals from fully paid sales only (exclude unpaid credit sales)
      const filteredSales = paidSales.filter((s) => filteredSaleIds.includes(s.id))
      const salesTotal = filteredSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
      
      // Calculate gross profit: (selling_price - cost_price) * quantity for each item
      // Only include items from fully paid sales (already filtered in productMap)
      let grossTotal = 0
      saleItems?.forEach((item) => {
        // Only calculate profit for items from paid sales
        if (item.product_id && filteredSaleIds.includes(item.sale_id)) {
          const costPrice = costPriceMap.get(item.product_id) || 0
          const sellingPrice = Number(item.unit_price || 0)
          const quantity = item.quantity
          const profit = (sellingPrice - costPrice) * quantity
          grossTotal += profit
        }
      })
      
      // Calculate total amount actually paid from payments (excluding debt_clearance as it's already counted in payment methods)
      const totalPaidFromPayments = Array.from(paymentMap.entries())
        .filter(([method]) => method !== "debt_clearance")
        .reduce((sum, [, amount]) => sum + amount, 0)

      setReportData(Array.from(productMap.values()))
      setPaymentSummaries(
        Array.from(paymentMap.entries()).map(([method, total]) => ({ method, total })),
      )
      setTotalSales(salesTotal)
      setTotalGross(grossTotal)
      setTotalExpenses(totalExpensesCalc)
    } catch (error) {
      console.error("Error fetching report data:", error)
      alert(`Error loading report: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, paymentFilter, storeFilter])

  const formatPaymentMethods = (methods: string[]) => {
    return methods
      .map((m) => m.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()))
      .join(", ")
  }

  const handleExport = () => {
    // Simple CSV export
    const headers = ["Product", "Quantity", "Amount", "Payment Methods"]
    const rows = reportData.map((item) => [
      item.product_name,
      item.total_quantity.toString(),
      item.total_amount.toFixed(2),
      formatPaymentMethods(item.payment_methods),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-report-${startDate}-to-${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sales Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeFilter">Store</Label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger id="storeFilter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentFilter">Payment Method</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger id="paymentFilter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button onClick={fetchReportData} variant="outline" className="flex-1" disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button onClick={handleExport} variant="outline" disabled={reportData.length === 0}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(reportData.length > 0 || totalExpenses > 0 || paymentSummaries.length > 0) && (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currency ? formatCurrency(totalSales, currency) : `$${totalSales.toFixed(2)}`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Paid sales only</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gross Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currency ? formatCurrency(totalGross, currency) : `$${totalGross.toFixed(2)}`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">From paid sales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {currency ? formatCurrency(totalExpenses, currency) : `$${totalExpenses.toFixed(2)}`}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {currency ? formatCurrency(totalGross - totalExpenses, currency) : `$${(totalGross - totalExpenses).toFixed(2)}`}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Products Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.length}</div>
              </CardContent>
            </Card>
          </div>

          {paymentSummaries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Payment Method Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {paymentSummaries.map((summary) => {
                    const methodLabel = summary.method === "debt_clearance" 
                      ? "Credit Payments (Debt Clearance)"
                      : summary.method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
                    return (
                      <Badge key={summary.method} variant="outline" className="text-base px-3 py-1">
                        {methodLabel}:{" "}
                        {currency ? formatCurrency(summary.total, currency) : `$${summary.total.toFixed(2)}`}
                      </Badge>
                    )
                  })}
                </div>
                {paymentSummaries.length === 0 && (
                  <p className="text-sm text-muted-foreground">No payments found for the selected period</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sales by Product</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading report data...</p>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sales data found for the selected date range and filters.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment Methods</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-right">{item.total_quantity}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {currency ? formatCurrency(item.total_amount, currency) : `$${item.total_amount.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.payment_methods.map((method) => (
                            <Badge key={method} variant="secondary" className="text-xs">
                              {method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {reportData.reduce((sum, item) => sum + item.total_quantity, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {currency ? formatCurrency(totalSales, currency) : `$${totalSales.toFixed(2)}`}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

