export type UserRole = "admin" | "manager" | "cashier"

export type PaymentMethod = "cash" | "mobile_money" | "bank_transfer" | "credit"

export type PaymentStatus = "pending" | "partial" | "paid"

export type QuotationStatus = "pending" | "sent" | "accepted" | "rejected" | "expired"

export type AdjustmentType = "addition" | "subtraction" | "damage" | "loss" | "correction"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  name: string
  short_name: string
  created_at: string
}

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
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  credit_limit: number
  balance: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  balance: number
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
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface SystemSettings {
  id: string
  setting_key: string
  setting_value: string
  updated_at: string
}

export interface CustomerPayment {
  id: string
  payment_number: string
  customer_id: string
  sale_id: string | null
  amount: number
  payment_method: "cash" | "mobile_money" | "bank_transfer" | "cheque"
  payment_date: string
  notes: string | null
  created_by: string
  created_at: string
}
