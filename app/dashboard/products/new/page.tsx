import { Header } from "@/components/dashboard/header"
import { ProductForm } from "@/components/products/product-form"
import { createClient } from "@/lib/supabase/server"

export default async function NewProductPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: units }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("units").select("id, name, short_name").order("name"),
  ])

  return (
    <div>
      <Header title="New Product" />
      <div className="p-6">
        <ProductForm categories={categories || []} units={units || []} />
      </div>
    </div>
  )
}
