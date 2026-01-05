import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { hasPermission, isAdmin, type Feature } from "@/lib/utils/permissions"

export async function PermissionGuard({ 
  feature, 
  children 
}: { 
  feature: Feature
  children: React.ReactNode 
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Admins have access to everything
  const admin = await isAdmin(user.id)
  if (admin) {
    return <>{children}</>
  }

  // Check if user has permission for this feature
  const hasAccess = await hasPermission(user.id, feature)
  
  if (!hasAccess) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
