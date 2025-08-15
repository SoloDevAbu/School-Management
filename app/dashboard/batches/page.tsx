import { requireAuth } from "@/lib/auth-utils"
import { BatchManagement } from "@/components/batches/batch-management"

export default async function BatchesPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
        <p className="text-gray-600">Manage academic year batches and sessions</p>
      </div>
      <BatchManagement />
    </div>
  )
}
