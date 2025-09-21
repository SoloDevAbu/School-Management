import { requireAuth } from "@/lib/auth-utils"
import DashboardManagement from "@/components/dashboard/dashboard-management"

export default async function DashboardPage() {
  const session = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {session.user.name}!</h1>
        <p className="text-gray-600">Here's what's happening in your school today.</p>
      </div>

      <DashboardManagement />
    </div>
  )
}
