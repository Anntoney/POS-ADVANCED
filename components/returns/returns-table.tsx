"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type SaleReturn = {
  id: string
  return_number: string
  return_date: string
  total_amount: number
  refund_method: string | null
  sales: {
    sale_number: string
    customers: { name: string } | null
  } | null
}

export function ReturnsTable({ returns }: { returns: SaleReturn[] }) {
  const [currency, setCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  if (returns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No returns found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Return Number</TableHead>
            <TableHead>Original Sale</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Refund Method</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returns.map((returnItem) => (
            <TableRow key={returnItem.id}>
              <TableCell className="font-medium">{returnItem.return_number}</TableCell>
              <TableCell>{returnItem.sales?.sale_number || "N/A"}</TableCell>
              <TableCell>{returnItem.sales?.customers?.name || "Walk-in"}</TableCell>
              <TableCell>{new Date(returnItem.return_date).toLocaleDateString()}</TableCell>
              <TableCell className="capitalize">
                {returnItem.refund_method ? returnItem.refund_method.replace("_", " ") : "-"}
              </TableCell>
              <TableCell className="font-semibold">
                {currency
                  ? formatCurrency(Number(returnItem.total_amount), currency)
                  : `$${Number(returnItem.total_amount).toFixed(2)}`}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/dashboard/returns/${returnItem.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
