import { requireAuth } from "@/lib/auth-utils"
import { FeeStructureManagement } from "@/components/fee-structure/fee-structure-management"

export default async function FeeStructurePage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fee Structure Management</h1>
        <p className="text-gray-600">Define and manage fee structures for each class</p>
      </div>
      <FeeStructureManagement />
    </div>
  )
}
