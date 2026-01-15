"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export function AddProductButton({ selectedStoreId }: { selectedStoreId: string | null }) {
  // Build the URL with storeId query parameter if a specific store is selected
  const href = selectedStoreId && selectedStoreId !== "both" 
    ? `/dashboard/products/new?storeId=${selectedStoreId}`
    : "/dashboard/products/new"

  return (
    <Button asChild>
      <Link href={href}>
        <Plus className="mr-2 h-4 w-4" />
        Add Product
      </Link>
    </Button>
  )
}
