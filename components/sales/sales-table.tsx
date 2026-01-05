"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type Sale = {
  id: string
  sale_number: string
  sale_date: string
  total_amount: number
  payment_method: string
  payment_status: string
  customers: { name: string } | null
}

export function SalesTable({ sales }: { sales: Sale[] }) {
  const [currency, setCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No sales found</p>
        <Button asChild className="mt-4">
          <Link href="/pos">Create your first sale</Link>
        </Button>
      </div>
    )
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "partial":
        return "secondary"
      case "pending":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sale Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.sale_number}</TableCell>
              <TableCell>{sale.customers?.name || "Walk-in"}</TableCell>
              <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
              <TableCell className="capitalize">{sale.payment_method.replace("_", " ")}</TableCell>
              <TableCell>
                <Badge variant={getPaymentStatusColor(sale.payment_status)} className="capitalize">
                  {sale.payment_status}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold">
                {currency
                  ? formatCurrency(Number(sale.total_amount), currency)
                  : `$${Number(sale.total_amount).toFixed(2)}`}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/dashboard/sales/${sale.id}`}>
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
