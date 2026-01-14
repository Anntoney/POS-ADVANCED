"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { createClient } from "@/lib/supabase/client"

type Store = {
  id: string
  name: string
}

export function ProductsStoreSelector({
  canAccessAllStores,
  userStoreId,
  onStoreChange
}: {
  canAccessAllStores: boolean
  userStoreId: string | null
  onStoreChange: (storeId: string | null) => void
}) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(userStoreId || null)
  const [stores, setStores] = useState<Store[]>([])
  const [isLoadingStores, setIsLoadingStores] = useState(false)

  useEffect(() => {
    if (canAccessAllStores) {
      loadStores()
    } else if (userStoreId) {
      // For non-admins, set their store as selected
      setSelectedStoreId(userStoreId)
      onStoreChange(userStoreId)
    }
  }, [canAccessAllStores, userStoreId])

  const loadStores = async () => {
    setIsLoadingStores(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error("Error loading stores:", error)
    } finally {
      setIsLoadingStores(false)
    }
  }

  const handleStoreChange = (value: string) => {
    const storeId = value === "both" ? "both" : value
    setSelectedStoreId(storeId)
    onStoreChange(storeId)
  }

  if (!canAccessAllStores) {
    // Non-admins don't need store selection
    return null
  }

  return (
    <>
      <LoadingDialog isOpen={isLoadingStores} message="Loading shops..." />
      <div className="space-y-2 mb-4">
        <Label htmlFor="storeSelect">Select Store *</Label>
        <Select value={selectedStoreId === "both" ? "both" : selectedStoreId || ""} onValueChange={handleStoreChange}>
          <SelectTrigger id="storeSelect" className="w-full sm:w-[300px]">
            <SelectValue placeholder="Select a store to view products and values" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
            <SelectItem value="both">Both Stores</SelectItem>
          </SelectContent>
        </Select>
        {!selectedStoreId && (
          <p className="text-sm text-muted-foreground">Please select a store to view products and values</p>
        )}
      </div>
    </>
  )
}
