import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { getDefaultCurrencyServer, formatCurrency } from "@/lib/utils/currency"

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
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Total Products",
      value: productsCount || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Total Sales",
      value: salesCount || 0,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "Total Customers",
      value: customersCount || 0,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
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
  )
}
