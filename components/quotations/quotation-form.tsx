"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Minus, Trash2, Search } from "lucide-react"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"
import type { Product, Customer } from "@/lib/types/database"

type CartItem = {
  product: Product
  quantity: number
  customPrice?: number
}

type QuotationFormProps = {
  products: Product[]
  customers: Customer[]
}

export function QuotationForm({ products, customers }: QuotationFormProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [discount, setDiscount] = useState("0")
  const [expiryDate, setExpiryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currency, setCurrency] = useState<Currency | null>(null)
  
  // Price editing dialog state
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editedPrice, setEditedPrice] = useState<string>("")
  const [priceError, setPriceError] = useState<string>("")
  
  const router = useRouter()

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
    // Set default expiry date to 30 days from now
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + 30)
    setExpiryDate(defaultExpiry.toISOString().split("T")[0])
  }, [])

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ""
  )

  const openPriceDialog = (product: Product) => {
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

    // Check if price is less than cost price (optional warning)
    if (price < (selectedProduct.cost_price || 0)) {
      const confirmLowPrice = confirm(
        `Price is less than cost price (${currency ? formatCurrency(selectedProduct.cost_price || 0, currency) : `$${(selectedProduct.cost_price || 0).toFixed(2)}`}). Continue anyway?`
      )
      if (!confirmLowPrice) {
        return
      }
    }

    // Add to cart with custom price
    const existingItem = cart.find((item) => item.product.id === selectedProduct.id)

    if (existingItem) {
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
    if (newQuantity < 1) {
      setCart(cart.filter((item) => item.product.id !== productId))
      return
    }

    setCart(cart.map((item) => (item.product.id === productId ? { ...item, quantity: newQuantity } : item)))
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
      return sum + (itemTotal * Number(item.product.tax_rate || 0)) / 100
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const discountAmount = Number.parseFloat(discount) || 0
    return subtotal + tax - discountAmount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      alert("Please add at least one item to the quotation")
      return
    }

    setIsProcessing(true)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("You must be logged in")
        setIsProcessing(false)
        return
      }

      // Get user's store_id
      const { data: profile } = await supabase.from("profiles").select("store_id").eq("id", user.id).single()
      const storeId = profile?.store_id || null

      const quotationNumber = `QUO-${Date.now()}`
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const discountAmount = Number.parseFloat(discount) || 0
      const total = calculateTotal()

      // Create quotation
      const { data: quotation, error: quotationError } = await supabase
        .from("quotations")
        .insert({
          quotation_number: quotationNumber,
          customer_id: selectedCustomer || null,
          quotation_date: new Date().toISOString(),
          expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: total,
          status: "pending",
          notes: notes || null,
          store_id: storeId,
          created_by: user.id,
        })
        .select()
        .single()

      if (quotationError) throw quotationError

      // Create quotation items
      for (const item of cart) {
        const itemPrice = getItemPrice(item)
        const itemTotal = itemPrice * item.quantity
        const itemTax = (itemTotal * Number(item.product.tax_rate || 0)) / 100

        const { error: itemError } = await supabase.from("quotation_items").insert({
          quotation_id: quotation.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: itemPrice,
          tax_rate: item.product.tax_rate || 0,
          tax_amount: itemTax,
          discount_amount: 0,
          total_amount: itemTotal + itemTax,
        })

        if (itemError) throw itemError
      }

      alert(`Quotation created successfully! Quotation #${quotationNumber}`)
      router.push("/dashboard/quotations")
      router.refresh()
    } catch (error: unknown) {
      alert(`Error creating quotation: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Products */}
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Search and add products to the quotation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div>{product.name}</div>
                          {product.sku && <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>}
                        </TableCell>
                        <TableCell>
                          {currency
                            ? formatCurrency(Number(product.selling_price), currency)
                            : `$${Number(product.selling_price).toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(product)}
                            title="Add with custom price"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Customer & Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer & Details</CardTitle>
            <CardDescription>Select customer and set quotation details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer (Optional)</Label>
              <Select 
                value={selectedCustomer || "walk-in"} 
                onValueChange={(value) => setSelectedCustomer(value === "walk-in" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes for this quotation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <Card>
        <CardHeader>
          <CardTitle>Quotation Items</CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No items in quotation</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => {
                  const itemPrice = getItemPrice(item)
                  const itemTotal = itemPrice * item.quantity
                  const itemTax = (itemTotal * Number(item.product.tax_rate || 0)) / 100

                  return (
                    <TableRow key={item.product.id}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {currency ? formatCurrency(itemPrice, currency) : `$${itemPrice.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {currency ? formatCurrency(itemTax, currency) : `$${itemTax.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {currency
                          ? formatCurrency(itemTotal + itemTax, currency)
                          : `$${(itemTotal + itemTax).toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-semibold">
              {currency ? formatCurrency(calculateSubtotal(), currency) : `$${calculateSubtotal().toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span className="font-semibold">
              {currency ? formatCurrency(calculateTax(), currency) : `$${calculateTax().toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between">
            <Label htmlFor="discount">Discount:</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-32"
              />
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total:</span>
            <span>
              {currency ? formatCurrency(calculateTotal(), currency) : `$${calculateTotal().toFixed(2)}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isProcessing || cart.length === 0}>
          {isProcessing ? "Creating..." : "Create Quotation"}
        </Button>
      </div>

      {/* Price Edit Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Product Price</DialogTitle>
            <DialogDescription>
              Enter a custom price for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={editedPrice}
                onChange={(e) => {
                  setEditedPrice(e.target.value)
                  setPriceError("")
                }}
                placeholder="Enter price"
              />
              {priceError && (
                <p className="text-sm text-red-600">{priceError}</p>
              )}
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Default price: {currency ? formatCurrency(Number(selectedProduct.selling_price), currency) : `$${Number(selectedProduct.selling_price).toFixed(2)}`}
                  {selectedProduct.cost_price && (
                    <span> | Cost: {currency ? formatCurrency(Number(selectedProduct.cost_price), currency) : `$${Number(selectedProduct.cost_price).toFixed(2)}`}</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPriceDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handlePriceConfirm}>
              Add to Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
