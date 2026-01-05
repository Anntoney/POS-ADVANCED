import { Header } from "@/components/dashboard/header"
import { SalesReport } from "@/components/reports/sales-report"

export default function ReportsPage() {
  return (
    <div>
      <Header title="Reports" />
      <div className="p-6">
        <SalesReport />
      </div>
    </div>
  )
}
