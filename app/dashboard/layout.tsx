import type React from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("[v0] Dashboard layout - user check:", { user: !!user, error })

    if (error || !user) {
      console.log("[v0] No user found, redirecting to login")
      redirect("/auth/login")
    }

    return (
      <div className="flex h-screen overflow-hidden" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 overflow-y-auto" suppressHydrationWarning>{children}</main>
      </div>
    )
  } catch (error) {
    console.error("[v0] Dashboard layout error:", error)
    redirect("/auth/login")
  }
}
