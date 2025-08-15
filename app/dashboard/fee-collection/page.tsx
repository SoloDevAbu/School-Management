import type { Metadata } from "next"
import FeeCollectionManagement from "@/components/fee-collection/fee-collection-management"

export const metadata: Metadata = {
  title: "Fee Collection | School Management System",
  description: "Manage student fee collection and payments",
}

export default function FeeCollectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Collection</h1>
        <p className="text-muted-foreground">Manage student fee collection and track payment status</p>
      </div>
      <FeeCollectionManagement />
    </div>
  )
}
