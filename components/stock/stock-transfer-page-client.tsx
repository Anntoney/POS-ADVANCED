"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CopyProductsDialog } from "./copy-products-dialog"
import { Copy, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Store = {
  id: string
  name: string
  is_active: boolean
}

export function StockTransferPageClient({ stores, userId }: { stores: Store[]; userId: string }) {
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy Products Between Stores
          </CardTitle>
          <CardDescription>
            Copy all products from one store to another. You can choose to copy with stock quantities or set stock to 0.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">What this does:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Copies all active products from the source store to the destination store</li>
                <li>Products that already exist (by SKU or name) in the destination store will be skipped</li>
                <li>You can choose to copy with the same stock quantities or set all stock to 0</li>
                <li>All prices and product details will be preserved</li>
              </ul>
            </div>
            <Button onClick={() => setIsCopyDialogOpen(true)} variant="default" className="w-full sm:w-auto">
              <Package className="mr-2 h-4 w-4" />
              Copy All Products
            </Button>
          </div>
        </CardContent>
      </Card>

      <CopyProductsDialog
        stores={stores}
        isOpen={isCopyDialogOpen}
        onClose={() => setIsCopyDialogOpen(false)}
        userId={userId}
      />
    </>
  )
}
