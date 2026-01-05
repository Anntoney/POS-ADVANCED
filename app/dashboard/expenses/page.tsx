import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"

export default function ExpensesPage() {
  return (
    <div>
      <Header title="Expenses" />
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Expenses Module</h3>
            <p className="text-muted-foreground">
              Track and manage business expenses. Categorize costs and maintain financial records.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
