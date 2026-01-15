"use client"

import { useState, useEffect } from "react"
import { ProductsValueCards } from "@/components/products/products-value-cards"
import { ProductsTable } from "@/components/products/products-table"
import { ProductsStoreSelector } from "@/components/products/products-store-selector"
import { AddProductButton } from "@/components/products/add-product-button"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")

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

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(query) ||
      product.categories?.name?.toLowerCase().includes(query) ||
      false
    )
  })

  return (
    <>
      <LoadingDialog isOpen={isLoadingProducts} message="Loading products..." />
      <div className="flex justify-end mb-4">
        <AddProductButton selectedStoreId={selectedStoreId} />
      </div>
      <ProductsStoreSelector
        canAccessAllStores={canAccessAllStores}
        userStoreId={userStoreId}
        onStoreChange={handleStoreChange}
      />
      
      <div className="mb-4 space-y-2">
        <Label htmlFor="search">Search Products</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled={!selectedStoreId && canAccessAllStores}
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        )}
      </div>
      
      <ProductsValueCards
        products={filteredProducts}
        canAccessAllStores={canAccessAllStores}
        userStoreId={userStoreId}
        selectedStoreId={selectedStoreId}
      />

      <ProductsTable
        products={filteredProducts}
        canAccessAllStores={canAccessAllStores}
        userStoreId={userStoreId}
        selectedStoreId={selectedStoreId}
        searchQuery={searchQuery}
      />
    </>
  )
}
