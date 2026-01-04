import { Header } from "@/components/dashboard/header"
import { SupplierForm } from "@/components/suppliers/supplier-form"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", id).single()

  if (!supplier) {
    notFound()
  }

  return (
    <div>
      <Header title="Edit Supplier" />
      <div className="p-6">
        <SupplierForm supplier={supplier} />
      </div>
    </div>
  )
}
