import { Header } from "@/components/dashboard/header"
import { CategoryForm } from "@/components/categories/category-form"

export default function NewCategoryPage() {
  return (
    <div>
      <Header title="New Category" />
      <div className="p-6">
        <CategoryForm />
      </div>
    </div>
  )
}
