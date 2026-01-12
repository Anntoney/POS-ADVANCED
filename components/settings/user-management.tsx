"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Building2 } from "lucide-react"

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  store_id: string | null
  created_at: string
}

type Store = {
  id: string
  name: string
}

type Permission = {
  id: string
  user_id: string
  feature: string
  can_access: boolean
}

const FEATURES = [
  { id: "dashboard", name: "Dashboard" },
  { id: "pos", name: "POS" },
  { id: "products", name: "Products" },
  { id: "categories", name: "Categories" },
  { id: "stock", name: "Stock" },
  { id: "stock_transfer", name: "Stock Transfer" },
  { id: "sales", name: "Sales" },
  { id: "purchases", name: "Purchases" },
  { id: "returns", name: "Returns" },
  { id: "customers", name: "Customers" },
  { id: "suppliers", name: "Suppliers" },
  { id: "credit", name: "Credit" },
  { id: "quotations", name: "Quotations" },
  { id: "expenses", name: "Expenses" },
  { id: "reports", name: "Reports" },
  { id: "settings", name: "Settings" },
]

export function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({})
  const router = useRouter()

  // Form state for creating user
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("cashier")
  const [storeId, setStoreId] = useState<string>("none")
  const [isActive, setIsActive] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
    loadStores()
  }, [])

  const loadStores = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("stores").select("id, name").eq("is_active", true).order("name")
    if (data) {
      setStores(data as Store[])
    }
  }

  const loadUsers = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (data) {
      setUsers(data as Profile[])
      // Load permissions for all users
      const userIds = data.map((u) => u.id)
      if (userIds.length > 0) {
        const { data: perms } = await supabase.from("user_permissions").select("*").in("user_id", userIds)
        if (perms) {
          const permsMap: Record<string, Permission[]> = {}
          perms.forEach((perm) => {
            if (!permsMap[perm.user_id]) {
              permsMap[perm.user_id] = []
            }
            permsMap[perm.user_id].push(perm as Permission)
          })
          setPermissions(permsMap)
        }
      }
    }
    setIsLoading(false)
  }

  const handleCreateUser = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create user via auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (authError) throw authError

      // Wait a bit for the profile trigger to create the profile
      if (authData.user) {
        // Wait for profile to be created by trigger
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Update profile with role, store, and active status
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            role: role,
            is_active: isActive,
            full_name: fullName,
            store_id: storeId === "none" ? null : storeId,
          })
          .eq("id", authData.user.id)

        if (profileError) {
          console.error("Profile update error:", profileError)
          // Try to create profile manually if update fails
          const { error: insertError } = await supabase.from("profiles").insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: role,
            is_active: isActive,
            store_id: storeId === "none" ? null : storeId,
          })
          if (insertError) throw insertError
        }

        // Create default permissions (all enabled)
        const defaultPermissions = FEATURES.map((feature) => ({
          user_id: authData.user.id,
          feature: feature.id,
          can_access: true,
        }))

        const { error: permError } = await supabase.from("user_permissions").insert(defaultPermissions)

        if (permError) {
          console.error("Permissions error:", permError)
          // Don't throw, permissions can be set later
        }
      }

      // Reset form
      setEmail("")
      setPassword("")
      setFullName("")
      setRole("cashier")
      setStoreId("none")
      setIsActive(true)
      setIsCreateDialogOpen(false)
      await loadUsers()
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to create user")
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenPermissions = async (user: Profile) => {
    setSelectedUser(user)
    const userPerms = permissions[user.id] || []

    // Initialize permissions map
    const permsMap: Record<string, boolean> = {}
    FEATURES.forEach((feature) => {
      const perm = userPerms.find((p) => p.feature === feature.id)
      permsMap[feature.id] = perm ? perm.can_access : false
    })
    setUserPermissions(permsMap)
    setIsPermissionsDialogOpen(true)
  }

  const handleOpenStoreAssignment = (user: Profile) => {
    setSelectedUser(user)
    setStoreId(user.store_id || "none")
    setIsStoreDialogOpen(true)
  }

  const handleUpdateStoreAssignment = async () => {
    if (!selectedUser) return

    setIsCreating(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ store_id: storeId === "none" ? null : storeId })
        .eq("id", selectedUser.id)

      if (error) throw error

      setIsStoreDialogOpen(false)
      setSelectedUser(null)
      await loadUsers()
    } catch (error: any) {
      setError(error.message || "Failed to update store assignment")
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return

    setIsCreating(true)
    setError(null)

    try {
      const supabase = createClient()

      // Update or insert permissions
      for (const feature of FEATURES) {
        const canAccess = userPermissions[feature.id] || false

        const { error } = await supabase.from("user_permissions").upsert(
          {
            user_id: selectedUser.id,
            feature: feature.id,
            can_access: canAccess,
          },
          {
            onConflict: "user_id,feature",
          },
        )

        if (error) throw error
      }

      setIsPermissionsDialogOpen(false)
      setSelectedUser(null)
      await loadUsers()
    } catch (error: any) {
      setError(error.message || "Failed to update permissions")
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleActive = async (user: Profile) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !user.is_active })
      .eq("id", user.id)

    if (error) {
      alert("Error updating user: " + error.message)
    } else {
      await loadUsers()
      router.refresh()
    }
  }

  const handleDeleteUser = async (user: Profile) => {
    if (!confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      return
    }

    // Note: User deletion requires admin API access
    // For now, we'll just deactivate the user
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", user.id)

    if (error) {
      alert("Error deactivating user: " + error.message)
    } else {
      await loadUsers()
      router.refresh()
    }
  }

  const getPermissionCount = (userId: string) => {
    const userPerms = permissions[userId] || []
    return userPerms.filter((p) => p.can_access).length
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-sm text-muted-foreground">Create and manage users and their permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system. They will receive an email to confirm their account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Store Assignment</Label>
                <Select value={storeId} onValueChange={setStoreId}>
                  <SelectTrigger id="store">
                    <SelectValue placeholder="Select store (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Store (Admin Access)</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">Active</Label>
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage system users and their access permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.store_id ? (
                        stores.find((s) => s.id === user.store_id)?.name || "Unknown Store"
                      ) : (
                        <span className="text-muted-foreground">No Store</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "destructive"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getPermissionCount(user.id)} / {FEATURES.length} features
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenStoreAssignment(user)} title="Assign Store">
                          <Building2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenPermissions(user)} title="Edit Permissions">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(user)}
                          title={user.is_active ? "Deactivate User" : "Activate User"}
                        >
                          {user.is_active ? "✓" : "✗"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions - {selectedUser?.full_name || selectedUser?.email}</DialogTitle>
            <DialogDescription>Select which features this user can access</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              {FEATURES.map((feature) => (
                <div key={feature.id} className="flex items-center justify-between p-3 border rounded-md">
                  <Label htmlFor={`perm-${feature.id}`} className="font-medium cursor-pointer">
                    {feature.name}
                  </Label>
                  <Switch
                    id={`perm-${feature.id}`}
                    checked={userPermissions[feature.id] || false}
                    onCheckedChange={(checked) => setUserPermissions({ ...userPermissions, [feature.id]: checked })}
                  />
                </div>
              ))}
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermissions} disabled={isCreating}>
              {isCreating ? "Saving..." : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Store Assignment Dialog */}
      <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Store - {selectedUser?.full_name || selectedUser?.email}</DialogTitle>
            <DialogDescription>Assign this user to a store. Users without a store assignment have admin access to all stores.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assign-store">Store</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger id="assign-store">
                  <SelectValue placeholder="Select store (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Store (Admin Access)</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStoreAssignment} disabled={isCreating}>
              {isCreating ? "Saving..." : "Save Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
