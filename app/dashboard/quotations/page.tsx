import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"

export default function QuotationsPage() {
  return (
    <div>
      <Header title="Quotations" />
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Quotations Module</h3>
            <p className="text-muted-foreground">
              Create and manage quotations for customers. Send quotes via email and convert them to sales.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
