"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Supplier } from "@/lib/types/database"
import { useEffect, useState } from "react"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()
  const [currency, setCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return

    const supabase = createClient()
    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    if (error) {
      alert("Error deleting supplier: " + error.message)
    } else {
      router.refresh()
    }
  }

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No suppliers found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/suppliers/new">Create your first supplier</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-medium">{supplier.name}</TableCell>
              <TableCell>{supplier.email || "-"}</TableCell>
              <TableCell>{supplier.phone || "-"}</TableCell>
              <TableCell>{supplier.city || "-"}</TableCell>
              <TableCell>
                <Badge variant={Number(supplier.balance) > 0 ? "default" : "secondary"}>
                  {currency
                    ? formatCurrency(Number(supplier.balance), currency)
                    : `$${Number(supplier.balance).toFixed(2)}`}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/dashboard/suppliers/${supplier.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
