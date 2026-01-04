import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"

export default function PurchasesPage() {
  return (
    <div>
      <Header title="Purchases" />
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Purchases Module</h3>
            <p className="text-muted-foreground">
              Purchase management functionality will be available here. Track inventory purchases from suppliers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
