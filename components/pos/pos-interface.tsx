"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, ShoppingCart, Trash2, AlertCircle, X, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type Product = {
  id: string
  name: string | null
  sku: string | null
  cost_price: number
  selling_price: number
  wholesale_price?: number | null
  stock_quantity: number
  tax_rate: number
  categories: { name: string } | null
  units: { short_name: string } | null
}

type Customer = {
  id: string
  name: string
  email: string | null
  balance: number
}

type CartItem = {
  product: Product
  quantity: number
  customPrice?: number // Custom selling price if edited
}

type Store = {
  id: string
  name: string
}

export function POSInterface({
  products: initialProducts,
  customers: initialCustomers,
  userId,
  canAccessAllStores = false,
  stores = [],
  userStoreId = null,
}: {
  products: Product[]
  customers: Customer[]
  userId: string
  canAccessAllStores?: boolean
  stores?: Store[]
  userStoreId?: string | null
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [discount, setDiscount] = useState("0")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currency, setCurrency] = useState<Currency | null>(null)
  const router = useRouter()
  
  // Store selection for admins
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(userStoreId || null)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  
  // Price editing dialog state
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editedPrice, setEditedPrice] = useState<string>("")
  const [priceError, setPriceError] = useState<string>("")

  type PaymentEntry = {
    method: string
    amount: string
  }

  const [payments, setPayments] = useState<PaymentEntry[]>([{ method: "cash", amount: "" }])
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("cash")

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
    loadDefaultPaymentMethod()
    // For admins, load stores
    if (canAccessAllStores && stores.length > 0) {
      setIsLoadingStores(true)
      // Stores are already passed as props, just mark as loaded
      setTimeout(() => setIsLoadingStores(false), 100)
    }
  }, [])

  // Load products when store is selected (for admins)
  useEffect(() => {
    if (canAccessAllStores && selectedStoreId) {
      loadProductsForStore(selectedStoreId)
    }
  }, [selectedStoreId, canAccessAllStores])

  const loadProductsForStore = async (storeId: string) => {
    setIsLoadingProducts(true)
    try {
      const supabase = createClient()
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          categories (name),
          units (short_name)
        `)
        .eq("is_active", true)
        .eq("store_id", storeId)
        .order("name")

      if (productsError) throw productsError

      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id, name, email, balance")
        .eq("store_id", storeId)
        .order("name")

      if (customersError) throw customersError

      setProducts(productsData || [])
      setCustomers(customersData || [])
    } catch (error) {
      console.error("Error loading products for store:", error)
      alert("Error loading products. Please try again.")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const loadDefaultPaymentMethod = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "default_payment_method")
        .single()

      if (data?.setting_value) {
        setDefaultPaymentMethod(data.setting_value)
        setPayments([{ method: data.setting_value, amount: "" }])
      }
    } catch (error) {
      console.error("Error loading default payment method:", error)
      // Keep default as "cash"
    }
  }

  // For admins, disable search if no store is selected
  const canSearch = !canAccessAllStores || selectedStoreId !== null

  const filteredProducts = canSearch
    ? products.filter(
        (p) =>
          (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
          (p.sku?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
      )
    : []

  const openPriceDialog = (product: Product) => {
    if (product.stock_quantity < 1) {
      alert("Product out of stock")
      return
    }
    setSelectedProduct(product)
    setEditedPrice(product.selling_price.toString())
    setPriceError("")
    setPriceDialogOpen(true)
  }

  const handlePriceConfirm = () => {
    if (!selectedProduct) return

    const price = Number.parseFloat(editedPrice)
    
    // Validate price
    if (isNaN(price) || price < 0) {
      setPriceError("Please enter a valid price")
      return
    }

    // Check if price is less than cost price
    if (price < selectedProduct.cost_price) {
      setPriceError(`Price cannot be less than cost price (${currency ? formatCurrency(selectedProduct.cost_price, currency) : `$${selectedProduct.cost_price.toFixed(2)}`})`)
      return
    }

    // Add to cart with custom price
    const existingItem = cart.find((item) => item.product.id === selectedProduct.id)

    if (existingItem) {
      if (existingItem.quantity >= selectedProduct.stock_quantity) {
        alert("Not enough stock available")
        setPriceDialogOpen(false)
        return
      }
      // If price is different, update it; otherwise just increase quantity
      if (existingItem.customPrice !== price) {
        setCart(cart.map((item) => 
          item.product.id === selectedProduct.id 
            ? { ...item, quantity: item.quantity + 1, customPrice: price } 
            : item
        ))
      } else {
        setCart(cart.map((item) => 
          item.product.id === selectedProduct.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        ))
      }
    } else {
      setCart([...cart, { 
        product: selectedProduct, 
        quantity: 1,
        customPrice: price !== selectedProduct.selling_price ? price : undefined
      }])
    }

    setPriceDialogOpen(false)
    setSelectedProduct(null)
    setEditedPrice("")
    setPriceError("")
  }

  const addToCart = (product: Product) => {
    // Open price dialog instead of directly adding
    openPriceDialog(product)
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find((i) => i.product.id === productId)
    if (!item) return

    if (newQuantity < 1) {
      setCart(cart.filter((i) => i.product.id !== productId))
      return
    }

    if (newQuantity > item.product.stock_quantity) {
      alert("Not enough stock available")
      return
    }

    setCart(cart.map((i) => (i.product.id === productId ? { ...i, quantity: newQuantity } : i)))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const getItemPrice = (item: CartItem) => {
    return item.customPrice !== undefined ? item.customPrice : item.product.selling_price
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)
  }

  const calculateTax = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = getItemPrice(item) * item.quantity
      return sum + (itemTotal * Number(item.product.tax_rate)) / 100
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const discountAmount = Number.parseFloat(discount) || 0
    return subtotal + tax - discountAmount
  }

  const calculateTotalPaid = () => {
    return payments.reduce((sum, payment) => {
      const amount = Number.parseFloat(payment.amount) || 0
      return sum + amount
    }, 0)
  }

  const getRemainingBalance = () => {
    const total = calculateTotal()
    const totalPaid = calculateTotalPaid()
    return Math.max(0, total - totalPaid)
  }

  const getChange = () => {
    const total = calculateTotal()
    const totalPaid = calculateTotalPaid()
    return Math.max(0, totalPaid - total)
  }

  const addPayment = () => {
    setPayments([...payments, { method: "cash", amount: "" }])
  }

  const removePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index))
    }
  }

  const updatePayment = (index: number, field: "method" | "amount", value: string) => {
    const updated = [...payments]
    updated[index] = { ...updated[index], [field]: value }
    setPayments(updated)
  }

  const autoFillRemaining = () => {
    const remaining = getRemainingBalance()
    if (remaining > 0) {
      const lastPayment = payments[payments.length - 1]
      if (!lastPayment.amount || Number.parseFloat(lastPayment.amount) === 0) {
        updatePayment(payments.length - 1, "amount", remaining.toFixed(2))
      }
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty")
      return
    }

    const total = calculateTotal()
    const totalPaid = calculateTotalPaid()
    const hasCreditPayment = payments.some((p) => p.method === "credit")
    const isWalkInCustomer = !selectedCustomer || selectedCustomer === ""
    
    // Validate payment amounts
    for (const payment of payments) {
      const amount = Number.parseFloat(payment.amount) || 0
      if (amount < 0) {
        alert("Invalid payment amount")
        return
      }
    }

    // For walk-in customers: amount paid must be greater than zero and cannot be less than total
    if (isWalkInCustomer) {
      if (totalPaid === 0) {
        alert("If it's credit, choose customer name. If not, enter paid amount in amount section.")
        return
      }
      if (totalPaid < total) {
        alert("Amount paid cannot be less than total amount for walk-in customers. Please enter the full amount or select a customer for credit sales.")
        return
      }
    }
    
    if (hasCreditPayment) {
      if (!selectedCustomer) {
        alert("Please select a customer for credit sales")
        return
      }
    }

    setIsProcessing(true)

    const supabase = createClient()

    try {
      const saleNumber = `SALE-${Date.now()}`
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const discountAmount = Number.parseFloat(discount) || 0

      // Determine payment status and primary payment method
      // If overpaid, only record the actual sale total as amount_paid (change is handled separately)
      const actualPaid = Math.min(totalPaid, total)
      let payStatus: "paid" | "partial" | "pending" = "paid"
      if (actualPaid === 0 && hasCreditPayment) {
        payStatus = "pending"
      } else if (actualPaid < total) {
          payStatus = "partial"
      }

      // Use first payment method as primary for backward compatibility
      const primaryPaymentMethod = payments[0]?.method || "cash"

      // Determine store_id: for admins use selectedStoreId, for others use userStoreId
      const saleStoreId = canAccessAllStores ? selectedStoreId : userStoreId
      
      if (!saleStoreId) {
        alert("Store information is missing. Please select a store.")
        setIsProcessing(false)
        return
      }

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          sale_number: saleNumber,
          customer_id: selectedCustomer || null,
          store_id: saleStoreId,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: total,
          payment_method: primaryPaymentMethod,
          payment_status: payStatus,
          amount_paid: actualPaid,
          created_by: userId,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Insert sale items
      for (const item of cart) {
        const itemPrice = getItemPrice(item)
        const itemTotal = itemPrice * item.quantity
        const itemTax = (itemTotal * Number(item.product.tax_rate)) / 100

        const { error: itemError } = await supabase.from("sale_items").insert({
          sale_id: sale.id,
          product_id: item.product.id,
          product_name: item.product.name || "Unknown Product",
          quantity: item.quantity,
          unit_price: itemPrice,
          tax_rate: item.product.tax_rate,
          tax_amount: itemTax,
          total_amount: itemTotal + itemTax,
        })

        if (itemError) throw itemError

        const newStock = item.product.stock_quantity - item.quantity
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.product.id)

        if (stockError) throw stockError
      }

      // Insert sale payments - record all payments as entered
      // The change (if any) is calculated as total payments - sale total
      for (const payment of payments) {
        const amount = Number.parseFloat(payment.amount) || 0
        if (amount > 0) {
          const { error: paymentError } = await supabase
            .from("sale_payments")
            .insert({
              sale_id: sale.id,
              payment_method: payment.method,
              amount: amount,
            })

          if (paymentError) throw paymentError
        }
      }

      // Update customer balance if there's credit or partial payment
      // Note: If there's change (overpayment), don't increase customer balance
      if (selectedCustomer && (hasCreditPayment || payStatus === "partial") && totalPaid <= total) {
        const selectedCustomerData = customers.find((c) => c.id === selectedCustomer)
        const balanceIncrease = total - actualPaid
        if (balanceIncrease > 0) {
        const { error: balanceError } = await supabase
          .from("customers")
          .update({
            balance: Number(selectedCustomerData?.balance || 0) + balanceIncrease,
          })
          .eq("id", selectedCustomer)

        if (balanceError) throw balanceError
        }
      }

      // Show success message with change if applicable
      const change = getChange()
      if (change > 0) {
        alert(
          `Sale completed successfully! Sale #${saleNumber}\nChange due: ${currency?.symbol || "$"}${change.toFixed(2)}`,
        )
      } else {
        alert(`Sale completed successfully! Sale #${saleNumber}`)
      }

      setCart([])
      setSelectedCustomer("")
      setPayments([{ method: "cash", amount: "" }])
      setDiscount("0")
      router.refresh()
    } catch (error: unknown) {
      alert(`Error processing sale: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <LoadingDialog isOpen={isProcessing} message="Processing sale..." />
      <LoadingDialog isOpen={isLoadingStores} message="Loading shops..." />
      <LoadingDialog isOpen={isLoadingProducts} message="Loading products..." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
      <div className="lg:col-span-2 space-y-4">
        {canAccessAllStores && stores.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="storeSelect">Select Store *</Label>
            <Select value={selectedStoreId || ""} onValueChange={setSelectedStoreId}>
              <SelectTrigger id="storeSelect" className="h-12 text-lg">
                <SelectValue placeholder="Select a store to search products" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedStoreId && (
              <p className="text-sm text-muted-foreground">Please select a store before searching for products</p>
            )}
          </div>
        )}
        <div>
          <Input
            placeholder={canSearch ? "Search products by name or SKU..." : "Select a store first to search products"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 text-lg"
            disabled={!canSearch}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:bg-muted transition-colors"
              onClick={() => addToCart(product)}
            >
              <CardHeader className="p-5">
                <CardTitle className="text-base font-semibold line-clamp-2">{product.name || "Unknown Product"}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="space-y-2">
                  <p className="text-xl font-bold">
                    {currency
                      ? formatCurrency(Number(product.selling_price), currency)
                      : `$${Number(product.selling_price).toFixed(2)}`}
                  </p>
                  {product.wholesale_price && product.wholesale_price > 0 && (
                    <p className="text-base text-blue-500 dark:text-blue-400 font-medium">
                      Wholesale: {currency
                        ? formatCurrency(Number(product.wholesale_price), currency)
                        : `$${Number(product.wholesale_price).toFixed(2)}`}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</p>
                  {product.categories && (
                    <Badge variant="outline" className="text-sm">
                      {product.categories.name}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Price Editing Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Selling Price</DialogTitle>
            <DialogDescription>
              Set the selling price for this item. Price cannot be less than the cost price (minimum shown below).
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium mb-1">Product</p>
                <p className="text-base">{selectedProduct.name || "Unknown Product"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Selling Price</p>
                  <p className="text-sm text-muted-foreground">
                    {currency
                      ? formatCurrency(selectedProduct.selling_price, currency)
                      : `$${selectedProduct.selling_price.toFixed(2)}`}
                  </p>
                </div>
                {selectedProduct.wholesale_price && selectedProduct.wholesale_price > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Wholesale Price</p>
                    <p className="text-sm text-muted-foreground">
                      {currency
                        ? formatCurrency(Number(selectedProduct.wholesale_price), currency)
                        : `$${Number(selectedProduct.wholesale_price).toFixed(2)}`}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min={selectedProduct.cost_price}
                  value={editedPrice}
                  onChange={(e) => {
                    setEditedPrice(e.target.value)
                    setPriceError("")
                  }}
                  className={priceError ? "border-red-500" : ""}
                  placeholder={selectedProduct.selling_price.toString()}
                />
                {priceError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {priceError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum: {currency
                    ? formatCurrency(selectedProduct.cost_price, currency)
                    : `$${selectedProduct.cost_price.toFixed(2)}`}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePriceConfirm}>
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col">
        <Card className="flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-120px)]">
          <CardHeader className="p-4 md:p-5 flex-shrink-0 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-6 w-6" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-4 md:p-5 lg:overflow-y-auto lg:flex-1 lg:min-h-0">
            {cart.length === 0 ? (
              <p className="text-base text-muted-foreground text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between gap-3 border-b pb-3 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold truncate text-indigo-900 dark:text-indigo-100">{item.product.name || "Unknown Product"}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                          {currency
                            ? formatCurrency(getItemPrice(item), currency)
                            : `$${getItemPrice(item).toFixed(2)}`}
                        </p>
                        {item.customPrice !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            <Edit className="h-3 w-3 mr-1" />
                            Custom
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center text-base font-semibold text-indigo-900 dark:text-indigo-100">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <div className="grid gap-2">
                <Label htmlFor="customer" className="text-sm font-medium">
                  Customer (Optional)
                </Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger id="customer" className="h-11 text-base">
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Walk-in Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {customers.find((c) => c.id === selectedCustomer) && (
                <div className="bg-muted p-4 rounded-md text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Current Balance:</span>
                    <span className="font-medium">
                      {currency
                        ? formatCurrency(
                            Number(customers.find((c) => c.id === selectedCustomer)?.balance || 0),
                            currency,
                          )
                        : `$${Number(customers.find((c) => c.id === selectedCustomer)?.balance || 0).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Payment Methods *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPayment}
                    className="h-9 text-sm"
                  >
                    + Add Payment
                  </Button>
                </div>
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Select
                          value={payment.method}
                          onValueChange={(value) => updatePayment(index, "method", value)}
                        >
                          <SelectTrigger className="h-11 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            {selectedCustomer && <SelectItem value="credit">Credit</SelectItem>}
                  </SelectContent>
                </Select>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                          placeholder={`Amount (${currency?.symbol || "$"})`}
                          value={payment.amount}
                          onChange={(e) => updatePayment(index, "amount", e.target.value)}
                          className="h-11 text-base border-blue-500 focus:border-blue-600 focus:ring-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100 font-semibold"
                        />
                      </div>
                      {payments.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 shrink-0 mt-0"
                          onClick={() => removePayment(index)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {getRemainingBalance() > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={autoFillRemaining}
                    className="w-full h-10 text-sm"
                  >
                    Fill Remaining ({currency?.symbol || "$"}{getRemainingBalance().toFixed(2)})
                  </Button>
                )}
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span>Total Paid:</span>
                  <span className="font-semibold">
                    {currency
                      ? formatCurrency(calculateTotalPaid(), currency)
                      : `${currency?.symbol || "$"}${calculateTotalPaid().toFixed(2)}`}
                  </span>
                </div>
                {getRemainingBalance() > 0 && (
                  <div className="flex justify-between text-lg text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border-2 border-amber-400 dark:border-amber-600">
                    <span>Remaining:</span>
                    <span>
                      {currency
                        ? formatCurrency(getRemainingBalance(), currency)
                        : `${currency?.symbol || "$"}${getRemainingBalance().toFixed(2)}`}
                    </span>
                  </div>
                )}
                {getChange() > 0 && (
                  <div className="flex justify-between text-lg text-green-700 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/20 p-4 rounded-md border-2 border-green-500 dark:border-green-600">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Change Due:
                    </span>
                    <span>
                      {currency
                        ? formatCurrency(getChange(), currency)
                        : `${currency?.symbol || "$"}${getChange().toFixed(2)}`}
                    </span>
                  </div>
                )}
                {getRemainingBalance() > 0 && selectedCustomer && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Balance will be added to customer credit
                    </p>
                  )}
                </div>

              <div className="grid gap-2">
                <Label htmlFor="discount" className="text-sm font-medium">
                  Discount ({currency?.symbol || "$"})
                </Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-11 text-base border-purple-500 focus:border-purple-600 focus:ring-purple-500 bg-purple-50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-100 font-semibold"
                />
              </div>

              <div className="space-y-2 text-base">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {currency ? formatCurrency(calculateSubtotal(), currency) : `$${calculateSubtotal().toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-medium">{currency ? formatCurrency(calculateTax(), currency) : `$${calculateTax().toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-medium">
                    -
                    {currency
                      ? formatCurrency(Number.parseFloat(discount || "0"), currency)
                      : `$${Number.parseFloat(discount || "0").toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-green-500">
                  <span className="text-green-700 dark:text-green-400">Total:</span>
                  <span className="text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/30 px-3 py-1 rounded-md">
                    {currency ? formatCurrency(calculateTotal(), currency) : `$${calculateTotal().toFixed(2)}`}
                  </span>
                </div>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                size="lg"
                onClick={handleCheckout}
                disabled={
                  cart.length === 0 ||
                  isProcessing ||
                  payments.some((p) => Number.parseFloat(p.amount || "0") < 0)
                }
              >
                {isProcessing
                  ? "Processing..."
                  : payments.some((p) => p.method === "credit")
                    ? "Sale on Credit"
                    : getChange() > 0
                      ? `Complete Sale (Change: ${currency?.symbol || "$"}${getChange().toFixed(2)})`
                      : "Complete Sale"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
