import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"

export default function ReportsPage() {
  return (
    <div>
      <Header title="Reports" />
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Reports Module</h3>
            <p className="text-muted-foreground">
              Generate comprehensive reports for sales, purchases, inventory, and financial analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
