import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CategoriesTable } from "@/components/categories/categories-table"
import { createClient } from "@/lib/supabase/server"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from("categories").select("*").order("created_at", { ascending: false })

  return (
    <div>
      <Header title="Categories" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Manage Categories</h2>
            <p className="text-sm text-muted-foreground">Create and manage product categories</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </div>
        <CategoriesTable categories={categories || []} />
      </div>
    </div>
  )
}
