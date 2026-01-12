"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, Edit, Building2 } from "lucide-react"
import type { Store } from "@/lib/types/database"

export function StoreManagement() {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const router = useRouter()

  // Form state
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("stores").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Error loading stores:", error)
      setError(error.message)
    } else {
      setStores((data as Store[]) || [])
    }
    setIsLoading(false)
  }

  const handleOpenCreate = () => {
    setName("")
    setAddress("")
    setPhone("")
    setEmail("")
    setIsActive(true)
    setError(null)
    setIsCreateDialogOpen(true)
  }

  const handleOpenEdit = (store: Store) => {
    setSelectedStore(store)
    setName(store.name)
    setAddress(store.address || "")
    setPhone(store.phone || "")
    setEmail(store.email || "")
    setIsActive(store.is_active)
    setError(null)
    setIsEditDialogOpen(true)
  }

  const handleCreateStore = async () => {
    if (!name.trim()) {
      setError("Store name is required")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()

      // Check current store count
      const { data: existingStores } = await supabase.from("stores").select("id").eq("is_active", true)
      if (existingStores && existingStores.length >= 2) {
        throw new Error("Maximum of 2 active stores allowed. Please deactivate an existing store first.")
      }

      const { error: insertError } = await supabase.from("stores").insert({
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        is_active: isActive,
      })

      if (insertError) throw insertError

      setIsCreateDialogOpen(false)
      await loadStores()
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to create store")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateStore = async () => {
    if (!selectedStore || !name.trim()) {
      setError("Store name is required")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()

      // Check store count if activating (only when changing from inactive to active)
      if (isActive && !selectedStore.is_active) {
        // Count active stores excluding the current store being edited
        const { data: existingStores } = await supabase
          .from("stores")
          .select("id")
          .eq("is_active", true)
          .neq("id", selectedStore.id)
        if (existingStores && existingStores.length >= 2) {
          throw new Error("Maximum of 2 active stores allowed. Please deactivate another store first.")
        }
      }

      const { error: updateError } = await supabase
        .from("stores")
        .update({
          name: name.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedStore.id)

      if (updateError) throw updateError

      setIsEditDialogOpen(false)
      setSelectedStore(null)
      await loadStores()
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to update store")
    } finally {
      setIsSaving(false)
    }
  }

  const activeStoresCount = stores.filter((s) => s.is_active).length
  const canCreateMore = activeStoresCount < 2

  if (isLoading) {
    return <div className="text-center py-8">Loading stores...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Store Management</h2>
          <p className="text-sm text-muted-foreground">Manage your stores (Maximum 2 stores allowed)</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} disabled={!canCreateMore}>
              <Plus className="mr-2 h-4 w-4" />
              Create Store
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Store</DialogTitle>
              <DialogDescription>Add a new store to your system. You can have a maximum of 2 active stores.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Store Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Store Name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Store Address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="store@example.com" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">Active</Label>
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
              {!canCreateMore && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  Maximum of 2 active stores reached. Deactivate a store to create a new one.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStore} disabled={isSaving || !canCreateMore}>
                {isSaving ? "Creating..." : "Create Store"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Stores ({activeStoresCount}/2 active)
          </CardTitle>
          <CardDescription>Manage your store locations and settings</CardDescription>
        </CardHeader>
        <CardContent>
          {stores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No stores found. Create your first store to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>{store.address || "—"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {store.phone && <div className="text-sm">{store.phone}</div>}
                        {store.email && <div className="text-sm text-muted-foreground">{store.email}</div>}
                        {!store.phone && !store.email && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={store.is_active ? "default" : "secondary"}>{store.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(store)} title="Edit Store">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
            <DialogDescription>Update store information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Store Name *</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Store Name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input id="edit-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Store Address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="store@example.com" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit-isActive" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStore} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
