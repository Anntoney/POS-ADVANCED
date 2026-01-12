import { createClient } from "@/lib/supabase/server"

export type Feature = 
  | "dashboard"
  | "pos"
  | "products"
  | "categories"
  | "stock"
  | "stock_transfer"
  | "sales"
  | "purchases"
  | "returns"
  | "customers"
  | "suppliers"
  | "credit"
  | "quotations"
  | "expenses"
  | "reports"
  | "settings"

export async function getUserPermissions(userId: string): Promise<Record<string, boolean>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("user_permissions")
    .select("feature, can_access")
    .eq("user_id", userId)

  const permissions: Record<string, boolean> = {}
  if (data) {
    data.forEach((perm) => {
      permissions[perm.feature] = perm.can_access
    })
  }

  return permissions
}

export async function hasPermission(userId: string, feature: Feature): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions[feature] === true
}

export async function checkUserRole(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single()
  return data?.role || null
}

// Admin users have access to everything
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await checkUserRole(userId)
  return role === "admin"
}
