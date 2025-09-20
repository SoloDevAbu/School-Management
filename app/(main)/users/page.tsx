import { requireAdmin } from "@/lib/auth-utils"
import { UserManagement } from "@/components/users/user-management"

export default async function UsersPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage staff accounts and permissions</p>
      </div>
      <UserManagement />
    </div>
  )
}
