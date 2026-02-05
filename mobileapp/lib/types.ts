export type UserRole = "admin" | "manager" | "cashier"

export type PaymentMethod = "cash" | "mobile_money" | "bank_transfer" | "credit"

export type PaymentStatus = "pending" | "partial" | "paid"

export interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  category_id: string | null
  unit_id: string | null
  description: string | null
  cost_price: number
  selling_price: number
  wholesale_price?: number
  stock_quantity: number
  min_stock_level: number
  tax_rate: number
  is_active: boolean
  store_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  sale_number: string
  customer_id: string | null
  sale_date: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  amount_paid: number
  notes: string | null
  store_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  customer?: {
    name: string
  }
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  balance: number
  store_id: string | null
  created_at: string
}

export interface Return {
  id: string
  return_number: string
  sale_id: string | null
  customer_id: string | null
  return_date: string
  subtotal: number
  tax_amount: number
  total_amount: number
  refund_method: PaymentMethod
  notes: string | null
  store_id: string | null
  created_by: string | null
  created_at: string
  customer?: {
    name: string
  }
  sale?: {
    sale_number: string
  }
}

export interface StockAdjustment {
  id: string
  product_id: string
  adjustment_type: 'addition' | 'subtraction' | 'damage' | 'loss' | 'correction'
  quantity: number
  reason: string | null
  store_id: string | null
  created_by: string | null
  created_at: string
}
