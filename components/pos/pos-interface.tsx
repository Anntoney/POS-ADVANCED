"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, ShoppingCart, Trash2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type Product = {
  id: string
  name: string
  sku: string
  selling_price: number
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
  credit_limit: number
}

type CartItem = {
  product: Product
  quantity: number
}

export function POSInterface({
  products,
  customers,
  userId,
}: {
  products: Product[]
  customers: Customer[]
  userId: string
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [searchTerm, setSearchTerm] = useState("")
  const [discount, setDiscount] = useState("0")
  const [amountPaid, setAmountPaid] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currency, setCurrency] = useState<Currency | null>(null)
  const router = useRouter()

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id)

    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        alert("Not enough stock available")
        return
      }
      setCart(cart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      if (product.stock_quantity < 1) {
        alert("Product out of stock")
        return
      }
      setCart([...cart, { product, quantity: 1 }])
    }
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

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.product.selling_price) * item.quantity, 0)
  }

  const calculateTax = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = Number(item.product.selling_price) * item.quantity
      return sum + (itemTotal * Number(item.product.tax_rate)) / 100
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const discountAmount = Number.parseFloat(discount) || 0
    return subtotal + tax - discountAmount
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty")
      return
    }

    if (!paymentMethod) {
      alert("Please select a payment method")
      return
    }

    setIsProcessing(true)

    const supabase = createClient()

    try {
      const saleNumber = `SALE-${Date.now()}`
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const discountAmount = Number.parseFloat(discount) || 0
      const total = calculateTotal()

      let paidAmount = total
      let payStatus: "paid" | "partial" | "pending" = "paid"

      if (paymentMethod === "credit") {
        const selectedCustomerData = customers.find((c) => c.id === selectedCustomer)
        if (selectedCustomerData) {
          const newBalance = Number(selectedCustomerData.balance) + total
          if (newBalance > Number(selectedCustomerData.credit_limit)) {
            alert("Credit limit exceeded!")
            setIsProcessing(false)
            return
          }
        } else {
          alert("Please select a customer for credit sales")
          setIsProcessing(false)
          return
        }
        paidAmount = 0
        payStatus = "pending"
      } else if (amountPaid) {
        paidAmount = Number.parseFloat(amountPaid)
        if (paidAmount < 0) {
          alert("Invalid payment amount")
          setIsProcessing(false)
          return
        }
        if (paidAmount < total) {
          payStatus = "partial"
        } else if (paidAmount >= total) {
          payStatus = "paid"
        }
      }

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          sale_number: saleNumber,
          customer_id: selectedCustomer || null,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: payStatus,
          amount_paid: paidAmount,
          created_by: userId,
        })
        .select()
        .single()

      if (saleError) throw saleError

      for (const item of cart) {
        const itemTotal = Number(item.product.selling_price) * item.quantity
        const itemTax = (itemTotal * Number(item.product.tax_rate)) / 100

        const { error: itemError } = await supabase.from("sale_items").insert({
          sale_id: sale.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
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

      if (selectedCustomer && (paymentMethod === "credit" || payStatus === "partial")) {
        const selectedCustomerData = customers.find((c) => c.id === selectedCustomer)
        const balanceIncrease = total - paidAmount
        const { error: balanceError } = await supabase
          .from("customers")
          .update({
            balance: Number(selectedCustomerData?.balance || 0) + balanceIncrease,
          })
          .eq("id", selectedCustomer)

        if (balanceError) throw balanceError
      }

      setCart([])
      setSelectedCustomer("")
      setPaymentMethod("cash")
      setDiscount("0")
      setAmountPaid("")
      alert(`Sale completed successfully! Sale #${saleNumber}`)
      router.refresh()
    } catch (error: unknown) {
      alert(`Error processing sale: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-3 gap-4 p-6">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <Input
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:bg-muted transition-colors"
              onClick={() => addToCart(product)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-sm line-clamp-2">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-1">
                  <p className="text-lg font-bold">
                    {currency
                      ? formatCurrency(Number(product.selling_price), currency)
                      : `$${Number(product.selling_price).toFixed(2)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</p>
                  {product.categories && (
                    <Badge variant="outline" className="text-xs">
                      {product.categories.name}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between gap-2 border-b pb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {currency
                          ? formatCurrency(Number(item.product.selling_price), currency)
                          : `$${Number(item.product.selling_price).toFixed(2)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 pt-4 border-t">
              <div className="grid gap-2">
                <Label htmlFor="customer" className="text-xs">
                  Customer (Optional)
                </Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger id="customer" className="h-9">
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
                <div className="bg-muted p-3 rounded-md text-xs space-y-1">
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
                  <div className="flex justify-between">
                    <span>Credit Limit:</span>
                    <span className="font-medium">
                      {currency
                        ? formatCurrency(
                            Number(customers.find((c) => c.id === selectedCustomer)?.credit_limit || 0),
                            currency,
                          )
                        : `$${Number(customers.find((c) => c.id === selectedCustomer)?.credit_limit || 0).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Credit:</span>
                    <span className="font-medium text-green-600">
                      {currency
                        ? formatCurrency(
                            Number(customers.find((c) => c.id === selectedCustomer)?.credit_limit || 0) -
                              Number(customers.find((c) => c.id === selectedCustomer)?.balance || 0),
                            currency,
                          )
                        : `$${(
                            Number(customers.find((c) => c.id === selectedCustomer)?.credit_limit || 0) -
                              Number(customers.find((c) => c.id === selectedCustomer)?.balance || 0)
                          ).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="payment" className="text-xs">
                  Payment Method *
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod !== "credit" && (
                <div className="grid gap-2">
                  <Label htmlFor="amountPaid" className="text-xs">
                    Amount Paid ({currency?.symbol || "$"}) - Optional
                  </Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`${calculateTotal().toFixed(2)} (Full payment)`}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="h-9"
                  />
                  {amountPaid && Number.parseFloat(amountPaid) < calculateTotal() && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Partial payment - balance will be added to credit
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="discount" className="text-xs">
                  Discount ({currency?.symbol || "$"})
                </Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {currency ? formatCurrency(calculateSubtotal(), currency) : `$${calculateSubtotal().toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{currency ? formatCurrency(calculateTax(), currency) : `$${calculateTax().toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>
                    -
                    {currency
                      ? formatCurrency(Number.parseFloat(discount || "0"), currency)
                      : `$${Number.parseFloat(discount || "0").toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>
                    {currency ? formatCurrency(calculateTotal(), currency) : `$${calculateTotal().toFixed(2)}`}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
              >
                {isProcessing ? "Processing..." : paymentMethod === "credit" ? "Sale on Credit" : "Complete Sale"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
