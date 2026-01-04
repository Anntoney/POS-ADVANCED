import { Header } from "@/components/dashboard/header"
import { ProductForm } from "@/components/products/product-form"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: product }, { data: categories }, { data: units }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("units").select("id, name, short_name").order("name"),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div>
      <Header title="Edit Product" />
      <div className="p-6">
        <ProductForm product={product} categories={categories || []} units={units || []} />
      </div>
    </div>
  )
}
