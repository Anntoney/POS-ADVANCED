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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "POS", href: "/pos", icon: ShoppingCart },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Categories", href: "/dashboard/categories", icon: FolderOpen },
  { name: "Stock", href: "/dashboard/stock", icon: Warehouse },
  { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
  { name: "Purchases", href: "/dashboard/purchases", icon: ShoppingBag },
  { name: "Returns", href: "/dashboard/returns", icon: ArrowLeftRight },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Suppliers", href: "/dashboard/suppliers", icon: UserCircle },
  { name: "Credit", href: "/dashboard/credit", icon: CreditCard },
  { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
  { name: "Expenses", href: "/dashboard/expenses", icon: DollarSign },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          POS System
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
