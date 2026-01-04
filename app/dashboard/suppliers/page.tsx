import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"
import { createClient } from "@/lib/supabase/server"

export default async function SuppliersPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false })

  return (
    <div>
      <Header title="Suppliers" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Manage Suppliers</h2>
            <p className="text-sm text-muted-foreground">Create and manage supplier information</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/suppliers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Link>
          </Button>
        </div>
        <SuppliersTable suppliers={suppliers || []} />
      </div>
    </div>
  )
}
