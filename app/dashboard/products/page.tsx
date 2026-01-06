import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import Link from "next/link"
import { ProductsTable } from "@/components/products/products-table"
import { createClient } from "@/lib/supabase/server"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDefaultCurrencyServer } from "@/lib/utils/currency-server"
import { formatCurrency } from "@/lib/utils/currency"
import { DownloadProductsReport } from "@/components/products/download-report"
import { getUserStoreContext } from "@/lib/utils/store-context"

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const storeContext = await getUserStoreContext(user.id)
  
  let productsQuery = supabase
    .from("products")
    .select(
      `
      *,
      categories (id, name),
      units (id, name, short_name)
    `,
    )

  // Filter by store if user is assigned to a store
  if (!storeContext.canAccessAllStores && storeContext.storeId) {
    productsQuery = productsQuery.eq("store_id", storeContext.storeId)
  }

  const { data: products } = await productsQuery.order("created_at", { ascending: false })

  const currency = await getDefaultCurrencyServer()

  // Calculate total values
  const totalBuyingValue = products?.reduce((sum, product) => {
    return sum + Number(product.cost_price || 0) * Number(product.stock_quantity || 0)
  }, 0) || 0

  const totalSellingValue = products?.reduce((sum, product) => {
    return sum + Number(product.selling_price || 0) * Number(product.stock_quantity || 0)
  }, 0) || 0

  return (
    <PermissionGuard feature="products">
      <div>
        <Header title="Products" />
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Manage Products</h2>
              <p className="text-sm text-muted-foreground">Create and manage your product inventory</p>
            </div>
            <div className="flex gap-2">
              <DownloadProductsReport products={products || []} currency={currency} />
              <Button asChild>
                <Link href="/dashboard/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
            </div>
          </div>

          {/* Total Values Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Total Buying Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalBuyingValue, currency)}</div>
                <p className="text-sm text-muted-foreground mt-1">Total value at cost price</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Total Selling Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalSellingValue, currency)}</div>
                <p className="text-sm text-muted-foreground mt-1">Total value at selling price</p>
              </CardContent>
            </Card>
          </div>

          <ProductsTable products={products || []} />
        </div>
      </div>
    </PermissionGuard>
  )
}
