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
import { LoadingDialog } from "@/components/ui/loading-dialog"

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
  const [storeFilter, setStoreFilter] = useState<string>("")
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([])
  const [reportData, setReportData] = useState<SalesReportData[]>([])
  const [paymentSummaries, setPaymentSummaries] = useState<PaymentMethodSummary[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [totalGross, setTotalGross] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStores, setIsLoadingStores] = useState(false)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
    loadStores()
  }, [])

  // Auto-fetch data when store is selected
  useEffect(() => {
    if (storeFilter) {
      fetchReportData()
    } else {
      // Clear data when no store is selected
      setReportData([])
      setPaymentSummaries([])
      setTotalSales(0)
      setTotalGross(0)
      setTotalExpenses(0)
    }
  }, [storeFilter])

  const loadStores = async () => {
    setIsLoadingStores(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setStores(data as Array<{ id: string; name: string }> || [])
    } catch (error) {
      console.error("Error loading stores:", error)
    } finally {
      setIsLoadingStores(false)
    }
  }

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

      // Filter by store - storeFilter is mandatory, so it should always have a value
      if (storeFilter === "all") {
        // Show all stores - don't filter by store_id (include all sales regardless of store_id)
      } else if (storeFilter) {
        // Filter by specific store - must match exactly
        // Note: .eq() already excludes NULL values, so we don't need .not()
        salesQuery = salesQuery.eq("store_id", storeFilter)
      } else {
        // No store selected - return empty
        setReportData([])
        setPaymentSummaries([])
        setTotalSales(0)
        setTotalGross(0)
        setTotalExpenses(0)
        setIsLoading(false)
        return
      }

      let { data: sales, error: salesError } = await salesQuery

      if (salesError) {
        console.error("Sales query error:", salesError)
        alert(`Error loading sales: ${salesError.message}`)
        setIsLoading(false)
        return
      }
      
      // Debug: Check what store_ids actually exist in sales for this date range
      if (storeFilter && storeFilter !== "all" && (!sales || sales.length === 0)) {
        // Query all sales in date range to see what store_ids exist
        const { data: allSalesInRange } = await supabase
          .from("sales")
          .select("id, store_id, sale_date, created_by")
          .gte("sale_date", `${startDate}T00:00:00`)
          .lte("sale_date", `${endDate}T23:59:59`)
        
        const uniqueStoreIds = [...new Set(allSalesInRange?.map((s: any) => s.store_id).filter((id: any) => id !== null && id !== undefined) || [])]
        const nullStoreIdCount = allSalesInRange?.filter((s: any) => s.store_id === null || s.store_id === undefined).length || 0
        
        console.log("Sales Report Debug - No sales found for store:", {
          selectedStoreFilter: storeFilter,
          dateRange: { startDate, endDate },
          totalSalesInDateRange: allSalesInRange?.length || 0,
          uniqueStoreIdsInRange: uniqueStoreIds,
          salesWithNullStoreId: nullStoreIdCount,
          sampleSales: allSalesInRange?.slice(0, 5).map((s: any) => ({ 
            id: s.id, 
            store_id: s.store_id, 
            sale_date: s.sale_date,
            created_by: s.created_by
          }))
        })
        
        // If all sales have NULL store_id, try to assign them based on the creator's store
        if (nullStoreIdCount > 0 && uniqueStoreIds.length === 0) {
          console.warn(`Warning: ${nullStoreIdCount} sales in this date range have NULL store_id. Attempting to assign store based on creator...`)
          
          // Get unique creator IDs from sales with NULL store_id
          const creatorIds = [...new Set(allSalesInRange?.filter((s: any) => !s.store_id && s.created_by).map((s: any) => s.created_by) || [])]
          
          if (creatorIds.length > 0) {
            // Get store_id for each creator from profiles
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, store_id")
              .in("id", creatorIds)
            
            // Create a map of creator_id -> store_id
            const creatorStoreMap = new Map()
            profiles?.forEach((p: any) => {
              if (p.store_id) {
                creatorStoreMap.set(p.id, p.store_id)
              }
            })
            
            // Get default store if creator doesn't have a store
            const { data: defaultStore } = await supabase
              .from("stores")
              .select("id")
              .eq("is_active", true)
              .order("created_at", { ascending: true })
              .limit(1)
              .single()
            
            const defaultStoreId = defaultStore?.id || storeFilter
            
            // Update sales with NULL store_id based on creator's store, or default store
            const salesToUpdate = allSalesInRange?.filter((s: any) => !s.store_id && s.created_by) || []
            
            for (const sale of salesToUpdate) {
              const assignedStoreId = creatorStoreMap.get(sale.created_by) || defaultStoreId
              
              await supabase
                .from("sales")
                .update({ store_id: assignedStoreId })
                .eq("id", sale.id)
            }
            
            console.log(`Updated ${salesToUpdate.length} sales with store_id based on creator's store`)
            
            // Re-query sales with the updated store_id
            const updatedSalesQuery = supabase
              .from("sales")
              .select("id, sale_date, total_amount, subtotal, store_id, payment_status, amount_paid")
              .gte("sale_date", `${startDate}T00:00:00`)
              .lte("sale_date", `${endDate}T23:59:59`)
              .eq("store_id", storeFilter)
            
            const { data: updatedSales, error: updatedError } = await updatedSalesQuery
            
            if (!updatedError && updatedSales && updatedSales.length > 0) {
              // Use the updated sales
              sales = updatedSales
              console.log(`Found ${updatedSales.length} sales after updating store_id`)
            }
          }
        }
      } else {
        // Debug: Log sales count and store filter for troubleshooting
        console.log("Sales Report Debug:", {
          storeFilter,
          salesCount: sales?.length || 0,
          dateRange: { startDate, endDate },
          sampleSales: sales?.slice(0, 3).map((s: any) => ({ 
            id: s.id, 
            store_id: s.store_id, 
            sale_date: s.sale_date,
            total_amount: s.total_amount 
          }))
        })
      }

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
      // Now that customer_payments has store_id, we can filter directly by store
      let creditPayments: any[] = []
      
      let creditPaymentsQuery = supabase
        .from("customer_payments")
        .select("payment_method, amount, payment_date, customer_id, store_id")
        .gte("payment_date", `${startDate}T00:00:00`)
        .lte("payment_date", `${endDate}T23:59:59`)

      // Filter by store_id directly if specific store is selected
      if (storeFilter && storeFilter !== "all") {
        creditPaymentsQuery = creditPaymentsQuery.eq("store_id", storeFilter)
      }

      const { data: creditPaymentsData, error: creditPaymentsError } = await creditPaymentsQuery
      if (creditPaymentsError) throw creditPaymentsError
      creditPayments = creditPaymentsData || []
      
      // Get customer IDs for credit sales filtering (still needed for credit sales query)
      let customerIdsForStore: string[] | null = null
      if (storeFilter && storeFilter !== "all") {
        const { data: customersInStore, error: customersError } = await supabase
          .from("customers")
          .select("id")
          .eq("store_id", storeFilter)
        
        if (customersError) throw customersError
        customerIdsForStore = customersInStore?.map(c => c.id) || []
      }

      // Extract customer IDs from credit payments
      const customerIdsWithPayments = [...new Set(creditPayments?.map((p: any) => p.customer_id).filter(Boolean) || [])]
      
      // Fetch all credit sales for these customers (including sales from any date)
      let clearedCreditSales: any[] = []
      let clearedCreditSaleItems: any[] = []
      
      if (customerIdsWithPayments.length > 0) {
        // Get all credit sales for customers who made payments in the date range
        let creditSalesQuery = supabase
          .from("sales")
          .select("id, customer_id, sale_date, total_amount, amount_paid, payment_status, store_id")
          .in("customer_id", customerIdsWithPayments)
          .in("payment_status", ["pending", "partial"])

        if (storeFilter && storeFilter !== "all") {
          creditSalesQuery = creditSalesQuery.eq("store_id", storeFilter)
        }

        const { data: allCreditSales, error: creditSalesError } = await creditSalesQuery
        if (creditSalesError) throw creditSalesError

        // For each customer, track payments chronologically to find which sales were cleared
        if (allCreditSales && allCreditSales.length > 0) {
          // Get all customer payments for these customers - before start date and up to end date
          // Filter by store_id directly if specific store is selected
          let paymentsBeforeQuery = supabase
            .from("customer_payments")
            .select("customer_id, amount")
            .in("customer_id", customerIdsWithPayments)
            .lt("payment_date", `${startDate}T00:00:00`)

          if (storeFilter && storeFilter !== "all") {
            paymentsBeforeQuery = paymentsBeforeQuery.eq("store_id", storeFilter)
          }

          const { data: paymentsBeforeStart, error: paymentsBeforeError } = await paymentsBeforeQuery

          if (paymentsBeforeError) throw paymentsBeforeError

          let paymentsUpToEndQuery = supabase
            .from("customer_payments")
            .select("customer_id, amount")
            .in("customer_id", customerIdsWithPayments)
            .lte("payment_date", `${endDate}T23:59:59`)

          if (storeFilter && storeFilter !== "all") {
            paymentsUpToEndQuery = paymentsUpToEndQuery.eq("store_id", storeFilter)
          }

          const { data: paymentsUpToEnd, error: paymentsUpToEndError } = await paymentsUpToEndQuery

          if (paymentsUpToEndError) throw paymentsUpToEndError

          // Calculate total payments per customer before start and up to end
          const paymentsBeforeByCustomer = new Map<string, number>()
          paymentsBeforeStart?.forEach(payment => {
            const customerId = payment.customer_id
            const current = paymentsBeforeByCustomer.get(customerId) || 0
            paymentsBeforeByCustomer.set(customerId, current + Number(payment.amount))
          })

          const paymentsUpToEndByCustomer = new Map<string, number>()
          paymentsUpToEnd?.forEach(payment => {
            const customerId = payment.customer_id
            const current = paymentsUpToEndByCustomer.get(customerId) || 0
            paymentsUpToEndByCustomer.set(customerId, current + Number(payment.amount))
          })

          // Group credit sales by customer and sort by date (oldest first - FIFO)
          const creditSalesByCustomer = new Map<string, Array<any>>()
          allCreditSales.forEach(sale => {
            const customerId = sale.customer_id
            if (!creditSalesByCustomer.has(customerId)) {
              creditSalesByCustomer.set(customerId, [])
            }
            creditSalesByCustomer.get(customerId)!.push(sale)
          })

          creditSalesByCustomer.forEach((customerCreditSales, customerId) => {
            // Sort sales by date (oldest first) - FIFO principle
            customerCreditSales.sort((a, b) => 
              new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
            )

            const totalPaymentsBefore = paymentsBeforeByCustomer.get(customerId) || 0
            const totalPaymentsUpToEnd = paymentsUpToEndByCustomer.get(customerId) || 0

            // Apply payments to sales in order (FIFO - First In First Out)
            let paymentsUsedBeforeStart = 0
            let paymentsUsedUpToEnd = 0

            for (const sale of customerCreditSales) {
              const saleTotal = Number(sale.total_amount)
              const initialPaid = Number(sale.amount_paid || 0)
              const remainingNeeded = saleTotal - initialPaid

              // Calculate how much was paid to this sale before start date
              const paymentsRemainingBeforeStart = totalPaymentsBefore - paymentsUsedBeforeStart
              const paidToSaleBeforeStart = Math.min(remainingNeeded, paymentsRemainingBeforeStart)
              const salePaidBeforeStart = initialPaid + paidToSaleBeforeStart

              // Calculate how much is paid to this sale up to end date
              const paymentsRemainingUpToEnd = totalPaymentsUpToEnd - paymentsUsedUpToEnd
              const paidToSaleUpToEnd = Math.min(remainingNeeded, paymentsRemainingUpToEnd)
              const salePaidUpToEnd = initialPaid + paidToSaleUpToEnd

              // Sale was cleared during date range if:
              // 1. It wasn't fully paid before start date
              // 2. It IS fully paid up to end date
              const wasNotClearedBefore = salePaidBeforeStart < saleTotal
              const wasClearedByEnd = salePaidUpToEnd >= saleTotal

              if (wasNotClearedBefore && wasClearedByEnd && !clearedCreditSales.find(s => s.id === sale.id)) {
                clearedCreditSales.push(sale)
              }

              // Update payments used for next sale (payments are applied in FIFO order)
              if (wasClearedByEnd) {
                // Sale was fully paid, so all remaining needed was used
                paymentsUsedBeforeStart += paidToSaleBeforeStart
                paymentsUsedUpToEnd += remainingNeeded
              } else {
                // Sale not fully paid, so only what was applied was used
                paymentsUsedBeforeStart += paidToSaleBeforeStart
                paymentsUsedUpToEnd += paidToSaleUpToEnd
              }
            }
          })

          // Fetch sale items for cleared credit sales
          if (clearedCreditSales.length > 0) {
            const clearedSaleIds = clearedCreditSales.map(s => s.id)
            const { data: clearedItems, error: clearedItemsError } = await supabase
              .from("sale_items")
              .select("sale_id, product_id, product_name, quantity, total_amount, unit_price")
              .in("sale_id", clearedSaleIds)

            if (clearedItemsError) throw clearedItemsError
            clearedCreditSaleItems = clearedItems || []
          }
        }
      }

      // Fetch expenses in the date range
      let expensesQuery = supabase
        .from("expenses")
        .select("amount, payment_method, expense_date")
        .gte("expense_date", `${startDate}T00:00:00`)
        .lte("expense_date", `${endDate}T23:59:59`)

      if (storeFilter && storeFilter !== "all") {
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

      // Group by product - for fully paid sales
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

      // Also group by product for cleared credit sales
      clearedCreditSaleItems?.forEach((item) => {
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
      // This is for normal sales only, not credit payments
      const normalSalesPaymentMap = new Map<string, number>()
      salePayments
        ?.filter((p) => filteredSaleIds.includes(p.sale_id))
        .forEach((p) => {
          const currentTotal = normalSalesPaymentMap.get(p.payment_method) || 0
          normalSalesPaymentMap.set(p.payment_method, currentTotal + Number(p.amount))
        })

      // Process credit payments (debt clearance) separately
      // Group them by payment method used
      const creditPaymentsByMethod = new Map<string, number>()
      let totalCreditPayments = 0
      creditPayments?.forEach((cp) => {
        const method = cp.payment_method || "cash"
        const currentTotal = creditPaymentsByMethod.get(method) || 0
        creditPaymentsByMethod.set(method, currentTotal + Number(cp.amount))
        totalCreditPayments += Number(cp.amount)
      })

      // Add normal sales payments to the payment map
      normalSalesPaymentMap.forEach((total, method) => {
        paymentMap.set(method, total)
      })

      // Add credit payments separately - show each method used for credit payments
      creditPaymentsByMethod.forEach((total, method) => {
        // Store with prefix to identify as credit payment
        const creditMethodKey = `credit_${method}`
        paymentMap.set(creditMethodKey, total)
      })

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
      const normalSalesTotal = filteredSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
      
      // Total Sales = Normal Sales + Credit Payments
      const salesTotal = normalSalesTotal + totalCreditPayments
      
      // Get product IDs from cleared credit sale items to fetch cost prices if not already fetched
      const clearedProductIds = [...new Set(clearedCreditSaleItems?.map(item => item.product_id).filter(Boolean) || [])]
      const newProductIds = clearedProductIds.filter(id => !productIds.includes(id))
      
      if (newProductIds.length > 0) {
        const { data: newProducts, error: newProductsError } = await supabase
          .from("products")
          .select("id, cost_price")
          .in("id", newProductIds)
        
        if (newProductsError) throw newProductsError
        newProducts?.forEach(product => {
          costPriceMap.set(product.id, Number(product.cost_price || 0))
        })
      }

      // Calculate gross profit: (selling_price - cost_price) * quantity for each item
      // Include items from fully paid sales AND cleared credit sales
      let grossTotal = 0
      
      // Gross profit from paid sales
      saleItems?.forEach((item) => {
        if (item.product_id && filteredSaleIds.includes(item.sale_id)) {
          const costPrice = costPriceMap.get(item.product_id) || 0
          const sellingPrice = Number(item.unit_price || 0)
          const quantity = item.quantity
          const profit = (sellingPrice - costPrice) * quantity
          grossTotal += profit
        }
      })
      
      // Gross profit from cleared credit sales
      clearedCreditSaleItems?.forEach((item) => {
        if (item.product_id) {
          const costPrice = costPriceMap.get(item.product_id) || 0
          const sellingPrice = Number(item.unit_price || 0)
          const quantity = item.quantity
          const profit = (sellingPrice - costPrice) * quantity
          grossTotal += profit
        }
      })

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

  // Auto-refresh when date or payment filter changes (but only if store is selected)
  useEffect(() => {
    if (storeFilter) {
      fetchReportData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, paymentFilter])

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
    <>
      <LoadingDialog isOpen={isLoading} message="Loading report data..." />
      <LoadingDialog isOpen={isLoadingStores} message="Loading shops..." />
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
              <Label htmlFor="storeFilter">Store *</Label>
              <Select value={storeFilter || ""} onValueChange={setStoreFilter}>
                <SelectTrigger id="storeFilter" className="w-full">
                  <SelectValue placeholder="Select a store to view reports" />
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
              {!storeFilter && (
                <p className="text-sm text-muted-foreground">Please select a store to view reports</p>
              )}
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
                <p className="text-xs text-muted-foreground mt-1">Normal sales + Credit payments</p>
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
                <div className="space-y-3">
                  {/* Normal Sales by Payment Method */}
                  {paymentSummaries.filter((s) => !s.method.startsWith("credit_") && s.method !== "debt_clearance").length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Normal Sales:</p>
                      <div className="flex flex-wrap gap-2">
                        {paymentSummaries
                          .filter((s) => !s.method.startsWith("credit_") && s.method !== "debt_clearance")
                          .map((summary) => {
                            const methodLabel = summary.method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
                            return (
                              <Badge key={summary.method} variant="outline" className="text-base px-3 py-1">
                                {methodLabel}:{" "}
                                {currency ? formatCurrency(summary.total, currency) : `$${summary.total.toFixed(2)}`}
                              </Badge>
                            )
                          })}
                      </div>
                    </div>
                  )}
                  
                  {/* Credit Payments (Debt Clearance) */}
                  {paymentSummaries.filter((s) => s.method.startsWith("credit_")).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Credit Payments (Debt Clearance):</p>
                      <div className="flex flex-wrap gap-2">
                        {paymentSummaries
                          .filter((s) => s.method.startsWith("credit_"))
                          .map((summary) => {
                            const method = summary.method.replace("credit_", "")
                            const methodLabel = method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
                            return (
                              <Badge key={summary.method} variant="outline" className="text-base px-3 py-1">
                                Credit Payments ({methodLabel}):{" "}
                                {currency ? formatCurrency(summary.total, currency) : `$${summary.total.toFixed(2)}`}
                              </Badge>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
                {paymentSummaries.filter((s) => !s.method.startsWith("credit_") && s.method !== "debt_clearance").length === 0 && 
                 paymentSummaries.filter((s) => s.method.startsWith("credit_")).length === 0 && (
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
    </>
  )
}

