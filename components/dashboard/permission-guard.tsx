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

  // Dashboard is accessible to all authenticated users (it's the main landing page)
  // No need to check permissions for dashboard - just allow access
  if (feature === "dashboard") {
    return <>{children}</>
  }

  // Check if user has permission for this feature
  const hasAccess = await hasPermission(user.id, feature)
  
  if (!hasAccess) {
    // Redirect to login if user doesn't have permission
    // This is safe because /auth/login is different from /dashboard, so no loop
    redirect("/auth/login")
  }

  return <>{children}</>
}
