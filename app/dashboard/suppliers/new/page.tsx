import { Header } from "@/components/dashboard/header"
import { SupplierForm } from "@/components/suppliers/supplier-form"

export default function NewSupplierPage() {
  return (
    <div>
      <Header title="New Supplier" />
      <div className="p-6">
        <SupplierForm />
      </div>
    </div>
  )
}
