import { Header } from "@/components/dashboard/header"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PermissionGuard } from "@/components/dashboard/permission-guard"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: profile }, { data: settings }, { data: currencies }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("system_settings").select("*"),
    supabase.from("currencies").select("*"),
  ])

  return (
    <PermissionGuard feature="settings">
      <div>
        <Header title="Settings" />
        <div className="p-6">
          <SettingsTabs profile={profile} settings={settings || []} currencies={currencies || []} />
        </div>
      </div>
    </PermissionGuard>
  )
}
