"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  UserCircle,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  FolderOpen,
  Warehouse,
  ArrowLeftRight,
  CreditCard,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { useEffect, useState } from "react"
import { getUserPermissions, isAdmin, type Feature } from "@/lib/utils/permissions-client"
import { NavigationLink } from "./navigation-link"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, feature: "dashboard" as Feature },
  { name: "POS", href: "/pos", icon: ShoppingCart, feature: "pos" as Feature },
  { name: "Products", href: "/dashboard/products", icon: Package, feature: "products" as Feature },
  { name: "Categories", href: "/dashboard/categories", icon: FolderOpen, feature: "categories" as Feature },
  { name: "Stock", href: "/dashboard/stock", icon: Warehouse, feature: "stock" as Feature },
  { name: "Stock Transfer", href: "/dashboard/stock/transfer", icon: Truck, feature: "stock_transfer" as Feature },
  { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart, feature: "sales" as Feature },
  { name: "Purchases", href: "/dashboard/purchases", icon: ShoppingBag, feature: "purchases" as Feature },
  { name: "Returns", href: "/dashboard/returns", icon: ArrowLeftRight, feature: "returns" as Feature },
  { name: "Customers", href: "/dashboard/customers", icon: Users, feature: "customers" as Feature },
  { name: "Suppliers", href: "/dashboard/suppliers", icon: UserCircle, feature: "suppliers" as Feature },
  { name: "Credit", href: "/dashboard/credit", icon: CreditCard, feature: "credit" as Feature },
  { name: "Quotations", href: "/dashboard/quotations", icon: FileText, feature: "quotations" as Feature },
  { name: "Expenses", href: "/dashboard/expenses", icon: DollarSign, feature: "expenses" as Feature },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, feature: "reports" as Feature },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, feature: "settings" as Feature },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; email: string; role: string } | null>(null)
  const [userStore, setUserStore] = useState<{ name: string } | null>(null)

  useEffect(() => {
    const loadPermissions = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Load user profile and store
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, role, store_id")
          .eq("id", user.id)
          .single()

        if (profile) {
          setUserProfile({
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role,
          })

          // Load store if user has one
          if (profile.store_id) {
            const { data: store } = await supabase
              .from("stores")
              .select("name")
              .eq("id", profile.store_id)
              .single()

            if (store) {
              setUserStore(store)
            }
          }
        }

        const admin = await isAdmin(user.id)
        setIsUserAdmin(admin)

        if (admin) {
          // Admins have access to everything
          const allPermissions: Record<string, boolean> = {}
          navigation.forEach((item) => {
            allPermissions[item.feature] = true
          })
          setPermissions(allPermissions)
        } else {
          const userPerms = await getUserPermissions(user.id)
          setPermissions(userPerms)
        }
      }
      setIsLoading(false)
    }

    loadPermissions()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
      setIsLoggingOut(false)
    }
  }

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter((item) => {
    if (isUserAdmin) return true
    return permissions[item.feature] === true
  })

  return (
    <>
      <LoadingDialog isOpen={isLoggingOut} message="Logging out..." />
      <div className="flex h-full w-64 flex-col border-r bg-sidebar shadow-lg" suppressHydrationWarning>
      <div className="flex h-16 items-center border-b border-sidebar-border px-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <NavigationLink href="/dashboard" pageName="Dashboard" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          POS System
        </NavigationLink>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground p-4">Loading...</div>
        ) : (
          filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <NavigationLink
                key={item.name}
                href={item.href}
                pageName={item.name}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavigationLink>
            )
          })
        )}
      </nav>
      <div className="border-t border-sidebar-border space-y-2 p-4 bg-sidebar-accent/30">
        {/* User Info Display */}
        {userProfile && (
          <div className="px-3 py-2 mb-2 rounded-md bg-sidebar-accent/50 border border-sidebar-border">
            <div className="flex items-center gap-2 mb-1">
              <UserCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-sidebar-foreground">
                {userProfile.full_name || userProfile.email}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mb-1">
              Role: <span className="font-medium capitalize">{userProfile.role}</span>
            </div>
            {userStore && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Warehouse className="h-3 w-3" />
                <span>Store: <span className="font-medium">{userStore.name}</span></span>
              </div>
            )}
            {!userStore && isUserAdmin && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Warehouse className="h-3 w-3" />
                <span>All Stores Access</span>
              </div>
            )}
          </div>
        )}
        <ThemeToggle />
        <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={handleLogout}>
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
    </>
  )
}
