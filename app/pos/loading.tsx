import { Loader2 } from "lucide-react"

export default function POSLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex h-16 items-center gap-4 border-b border-border bg-gradient-to-r from-background via-primary/5 to-background px-6 shadow-sm">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Point of Sale...</p>
        </div>
      </div>
    </div>
  )
}
