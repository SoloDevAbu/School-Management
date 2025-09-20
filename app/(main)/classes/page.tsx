import { requireAuth } from "@/lib/auth-utils"
import { ClassManagement } from "@/components/classes/class-management"

export default async function ClassesPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
        <p className="text-gray-600">Manage classes and sections for each academic batch</p>
      </div>
      <ClassManagement />
    </div>
  )
}
