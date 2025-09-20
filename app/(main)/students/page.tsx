import { requireAuth } from "@/lib/auth-utils"
import { StudentManagement } from "@/components/students/student-management"

export default async function StudentsPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <p className="text-gray-600">Manage student profiles, enrollment, and academic records</p>
      </div>
      <StudentManagement />
    </div>
  )
}
