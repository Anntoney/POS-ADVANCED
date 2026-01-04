import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"

export default function ReturnsPage() {
  return (
    <div>
      <Header title="Returns" />
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Returns Module</h3>
            <p className="text-muted-foreground">
              Manage sale and purchase returns here. Process refunds and adjust inventory accordingly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
