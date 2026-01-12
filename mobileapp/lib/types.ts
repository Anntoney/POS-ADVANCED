export type UserRole = "admin" | "manager" | "cashier"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  store_id: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  category_id: string | null
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

export interface Category {
  id: string
  name: string
  description: string | null
  store_id: string | null
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
  balance: number
  store_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  customer_id: string | null
  total_amount: number
  discount_amount: number
  tax_amount: number
  payment_method: string
  payment_status: string
  store_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerPayment {
  id: string
  payment_number: string
  customer_id: string
  sale_id: string | null
  amount: number
  payment_method: string
  payment_date: string
  notes: string | null
  created_by: string
  created_at: string
}