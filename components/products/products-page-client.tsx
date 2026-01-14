"use client"

import { useState, useEffect } from "react"
import { ProductsValueCards } from "@/components/products/products-value-cards"
import { ProductsTable } from "@/components/products/products-table"
import { ProductsStoreSelector } from "@/components/products/products-store-selector"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { createClient } from "@/lib/supabase/client"

type Product = {
  id: string
  name: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  store_id: string | null
  categories?: { id: string; name: string } | null
  units?: { id: string; name: string; short_name: string } | null
  is_active?: boolean
}

type Store = {
  id: string
  name: string
}

export function ProductsPageClient({
  initialProducts,
  canAccessAllStores,
  userStoreId,
  stores
}: {
  initialProducts: Product[]
  canAccessAllStores: boolean
  userStoreId: string | null
  stores: Store[]
}) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(userStoreId || null)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  useEffect(() => {
    if (!canAccessAllStores && userStoreId) {
      // Non-admins already have products loaded
      setProducts(initialProducts)
      setSelectedStoreId(userStoreId)
    }
  }, [])

  // Load products when store is selected (for admins)
  useEffect(() => {
    if (canAccessAllStores && selectedStoreId && selectedStoreId !== "both") {
      loadProducts(selectedStoreId)
    } else if (canAccessAllStores && selectedStoreId === "both") {
      loadAllProducts()
    }
  }, [selectedStoreId, canAccessAllStores])

  const loadProducts = async (storeId: string) => {
    setIsLoadingProducts(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (id, name),
          units (id, name, short_name)
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts((data as any) || [])
    } catch (error) {
      console.error("Error loading products:", error)
      alert("Error loading products. Please try again.")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const loadAllProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (id, name),
          units (id, name, short_name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts((data as any) || [])
    } catch (error) {
      console.error("Error loading products:", error)
      alert("Error loading products. Please try again.")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleStoreChange = (storeId: string | null) => {
    setSelectedStoreId(storeId)
  }

  return (
    <>
      <LoadingDialog isOpen={isLoadingProducts} message="Loading products..." />
      <ProductsStoreSelector
        canAccessAllStores={canAccessAllStores}
        userStoreId={userStoreId}
        onStoreChange={handleStoreChange}
      />
      
      <ProductsValueCards
        products={products}
        canAccessAllStores={canAccessAllStores}
        userStoreId={userStoreId}
        selectedStoreId={selectedStoreId}
      />

      <ProductsTable
        products={products}
        canAccessAllStores={canAccessAllStores}
        userStoreId={userStoreId}
        selectedStoreId={selectedStoreId}
      />
    </>
  )
}
