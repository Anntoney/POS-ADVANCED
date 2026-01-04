import { Header } from "@/components/dashboard/header"
import { CategoryForm } from "@/components/categories/category-form"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: category } = await supabase.from("categories").select("*").eq("id", id).single()

  if (!category) {
    notFound()
  }

  return (
    <div>
      <Header title="Edit Category" />
      <div className="p-6">
        <CategoryForm category={category} />
      </div>
    </div>
  )
}
