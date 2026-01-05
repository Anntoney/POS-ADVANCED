import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { getDefaultCurrencyServer } from "@/lib/utils/currency-server"
import { formatCurrency } from "@/lib/utils/currency"
import { PermissionGuard } from "@/components/dashboard/permission-guard"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch dashboard stats
  const [{ count: productsCount }, { count: customersCount }, { count: salesCount }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("sales").select("*", { count: "exact", head: true }),
  ])

  const { data: sales } = await supabase.from("sales").select("total_amount")

  const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0

  const currency = await getDefaultCurrencyServer()

  const stats = [
    {
      name: "Total Revenue",
      value: formatCurrency(totalRevenue, currency),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
      gradient: "from-primary/20 to-primary/5",
    },
    {
      name: "Total Products",
      value: productsCount || 0,
      icon: Package,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      gradient: "from-secondary/20 to-secondary/5",
    },
    {
      name: "Total Sales",
      value: salesCount || 0,
      icon: ShoppingCart,
      color: "text-accent",
      bgColor: "bg-accent/10",
      gradient: "from-accent/20 to-accent/5",
    },
    {
      name: "Total Customers",
      value: customersCount || 0,
      icon: Users,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-100 dark:bg-teal-900/30",
      gradient: "from-teal-200/50 to-teal-100/30 dark:from-teal-800/30 dark:to-teal-900/20",
    },
  ]

  return (
    <PermissionGuard feature="dashboard">
      <div>
        <Header title="Dashboard" />
        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.name} className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
                  <div className={`rounded-full p-2.5 bg-gradient-to-br ${stat.gradient} ${stat.bgColor} shadow-sm`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No recent activity to display</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">All products are well stocked</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
