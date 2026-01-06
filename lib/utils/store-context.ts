import { createClient } from "@/lib/supabase/server"

export async function getUserStoreId(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: profile } = await supabase.from("profiles").select("store_id, role").eq("id", userId).single()
  
  // Admins without a store_id can access all stores
  // Users with a store_id are limited to their store
  return profile?.store_id || null
}

export async function getUserStoreContext(userId: string): Promise<{
  storeId: string | null
  isAdmin: boolean
  canAccessAllStores: boolean
}> {
  const supabase = await createClient()
  const { data: profile } = await supabase.from("profiles").select("store_id, role").eq("id", userId).single()
  
  const isAdmin = profile?.role === "admin"
  const storeId = profile?.store_id || null
  const canAccessAllStores = isAdmin && !storeId
  
  return {
    storeId,
    isAdmin: isAdmin || false,
    canAccessAllStores,
  }
}
