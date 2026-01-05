import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CustomersTable } from "@/components/customers/customers-table"
import { createClient } from "@/lib/supabase/server"

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase.from("customers").select("*").order("created_at", { ascending: false })

  return (
    <div>
      <Header title="Customers" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Manage Customers</h2>
            <p className="text-sm text-muted-foreground">Create and manage customer information</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>
        <CustomersTable customers={customers || []} />
      </div>
    </div>
  )
}
