import { Header } from "@/components/dashboard/header"
import { CustomerForm } from "@/components/customers/customer-form"

export default function NewCustomerPage() {
  return (
    <div>
      <Header title="New Customer" />
      <div className="p-6">
        <CustomerForm />
      </div>
    </div>
  )
}
