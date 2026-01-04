import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ProductsTable } from "@/components/products/products-table"
import { createClient } from "@/lib/supabase/server"

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (id, name),
      units (id, name, short_name)
    `,
    )
    .order("created_at", { ascending: false })

  return (
    <div>
      <Header title="Products" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Manage Products</h2>
            <p className="text-sm text-muted-foreground">Create and manage your product inventory</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
        <ProductsTable products={products || []} />
      </div>
    </div>
  )
}
