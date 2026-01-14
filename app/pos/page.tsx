import { Header } from "@/components/dashboard/header"
import { POSInterface } from "@/components/pos/pos-interface"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { hasPermission, type Feature } from "@/lib/utils/permissions"

export default async function POSPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get profile and permissions in parallel to optimize performance
  const [profileResult, permissionsResult] = await Promise.all([
    supabase.from("profiles").select("store_id, role").eq("id", user.id).single(),
    supabase.from("user_permissions").select("feature, can_access").eq("user_id", user.id),
  ])

  const profile = profileResult.data
  const isAdmin = profile?.role === "admin"
  const storeId = profile?.store_id || null
  const canAccessAllStores = isAdmin && !storeId

  // Check permissions - admins have access to everything
  if (!isAdmin) {
    const permissions = permissionsResult.data || []
    const posPermission = permissions.find((p) => p.feature === "pos")
    if (!posPermission || !posPermission.can_access) {
      redirect("/dashboard")
    }
  }

  // Build queries based on store context
  let productsQuery = supabase
    .from("products")
    .select(`
      *,
      categories (name),
      units (short_name)
    `)
    .eq("is_active", true)

  let customersQuery = supabase.from("customers").select("id, name, email, balance")

  // Filter by store if user is assigned to a store
  if (!canAccessAllStores && storeId) {
    productsQuery = productsQuery.eq("store_id", storeId)
    customersQuery = customersQuery.eq("store_id", storeId)
  }

  // Fetch stores for admins
  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("is_active", true)
    .order("name")

  // For non-admins, fetch data immediately
  // For admins, we'll fetch products dynamically based on selected store
  let initialProducts: any[] = []
  let initialCustomers: any[] = []

  if (!canAccessAllStores) {
    const [{ data: products }, { data: customers }] = await Promise.all([
      productsQuery.order("name"),
      customersQuery.order("name"),
    ])
    initialProducts = products || []
    initialCustomers = customers || []
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Point of Sale" showMenu />
      <div className="flex-1 overflow-y-auto">
        <POSInterface 
          products={initialProducts} 
          customers={initialCustomers} 
          userId={user.id}
          canAccessAllStores={canAccessAllStores}
          stores={stores || []}
          userStoreId={storeId}
        />
      </div>
    </div>
  )
}
