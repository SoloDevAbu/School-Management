import { requireAuth } from "@/lib/auth-utils"
import { SubjectManagement } from "@/components/subjects/subject-management"

export default async function SubjectsPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subject Management</h1>
        <p className="text-gray-600">Manage subjects and curriculum for each class</p>
      </div>
      <SubjectManagement />
    </div>
  )
}
