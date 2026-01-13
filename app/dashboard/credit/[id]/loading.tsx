import { Loader2 } from "lucide-react"
import { Header } from "@/components/dashboard/header"

export default function CreditDetailLoading() {
  return (
    <div>
      <Header title="Credit Details" />
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading credit details...</p>
        </div>
      </div>
    </div>
  )
}
