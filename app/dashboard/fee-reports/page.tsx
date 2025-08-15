import type { Metadata } from "next"
import FeeReportsManagement from "@/components/fee-reports/fee-reports-management"

export const metadata: Metadata = {
  title: "Fee Reports | School Management System",
  description: "Generate and view fee collection reports",
}

export default function FeeReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Reports</h1>
        <p className="text-muted-foreground">Generate comprehensive fee collection and payment reports</p>
      </div>
      <FeeReportsManagement />
    </div>
  )
}
