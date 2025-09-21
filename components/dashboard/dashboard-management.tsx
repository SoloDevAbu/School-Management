"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen, IndianRupee, UserCheck, Activity, CreditCard, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface DashboardData {
  summary: {
    totalStudents: number
    totalClasses: number
    activeClasses: number
    totalStaff: number
    totalCollectedFees: number
    studentsInBatch: number
    batchCollectedFees: number
  }
  batches: Array<{
    id: string
    name: string
    startYear: number
    endYear: number
  }>
  selectedBatch: {
    id: string
    name: string
    startYear: number
    endYear: number
  } | null
}

interface Activity {
  id: string
  studentName: string
  studentRoll: string
  action: string
  field: string
  user: string
  createdAt: string
}

interface Payment {
  id: string
  studentName: string
  studentRoll: string
  amount: number
  paymentDate: string
  paymentMethod: string
  status: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function DashboardManagement() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<string>("")
  const [loading, setLoading] = useState(true)
  
  // Activities state
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesPagination, setActivitiesPagination] = useState<PaginationInfo | null>(null)
  const [activitiesPage, setActivitiesPage] = useState(1)
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  
  // Payments state
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsPagination, setPaymentsPagination] = useState<PaginationInfo | null>(null)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [selectedBatch])

  useEffect(() => {
    if (dashboardData) {
      fetchActivities()
      fetchPayments()
    }
  }, [selectedBatch, dashboardData])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBatch) {
        params.append("batchId", selectedBatch)
      }

      const response = await fetch(`/api/dashboard?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
        
        // Set default batch if not already set
        if (!selectedBatch && data.batches.length > 0) {
          setSelectedBatch(data.batches[0].id)
        }
      } else {
        toast.error("Failed to fetch dashboard data")
      }
    } catch (error) {
      toast.error("Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async (page: number = 1) => {
    setActivitiesLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", "5")
      if (selectedBatch) {
        params.append("batchId", selectedBatch)
      }

      const response = await fetch(`/api/dashboard/activities?${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
        setActivitiesPagination(data.pagination)
        setActivitiesPage(page)
      } else {
        toast.error("Failed to fetch activities")
      }
    } catch (error) {
      toast.error("Failed to fetch activities")
    } finally {
      setActivitiesLoading(false)
    }
  }

  const fetchPayments = async (page: number = 1) => {
    setPaymentsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", "5")
      if (selectedBatch) {
        params.append("batchId", selectedBatch)
      }

      const response = await fetch(`/api/dashboard/payments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
        setPaymentsPagination(data.pagination)
        setPaymentsPage(page)
      } else {
        toast.error("Failed to fetch payments")
      }
    } catch (error) {
      toast.error("Failed to fetch payments")
    } finally {
      setPaymentsLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return "➕"
      case "UPDATE":
        return "✏️"
      case "DELETE":
        return "🗑️"
      default:
        return "📝"
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      CASH: "bg-blue-100 text-blue-800",
      CARD: "bg-purple-100 text-purple-800",
      UPI: "bg-green-100 text-green-800",
      BANK_TRANSFER: "bg-orange-100 text-orange-800",
      CHEQUE: "bg-gray-100 text-gray-800",
    }

    return (
      <Badge className={colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {method.replace("_", " ")}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  if (!dashboardData) {
    return <div>No dashboard data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Batch Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter by Batch:</span>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {dashboardData.batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.startYear}-{batch.endYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {dashboardData.selectedBatch && (
              <div className="text-sm text-muted-foreground">
                Showing data for: <span className="font-medium">{dashboardData.selectedBatch.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.summary.studentsInBatch} in selected batch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.summary.activeClasses} active classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalStaff}</div>
            <p className="text-xs text-muted-foreground">Teachers, admins & staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected Fees</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dashboardData.summary.totalCollectedFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₹{dashboardData.summary.batchCollectedFees.toLocaleString()} from selected batch
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto">
              {activitiesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-muted-foreground">Loading activities...</div>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-3 p-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <span className="text-lg">{getActivityIcon(activity.action)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {activity.studentName} ({activity.studentRoll})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.action} {activity.field} by {activity.user}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {activitiesPagination && activitiesPagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Page {activitiesPagination.currentPage} of {activitiesPagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchActivities(activitiesPage - 1)}
                    disabled={!activitiesPagination.hasPrevPage || activitiesLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchActivities(activitiesPage + 1)}
                    disabled={!activitiesPagination.hasNextPage || activitiesLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto">
              {paymentsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-muted-foreground">Loading payments...</div>
                </div>
              ) : payments.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No recent payments</p>
                </div>
              ) : (
                <div className="space-y-3 p-6">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                      <div>
                        <p className="text-sm font-medium">
                          {payment.studentName} ({payment.studentRoll})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          ₹{payment.amount.toLocaleString()}
                        </p>
                        {getPaymentMethodBadge(payment.paymentMethod)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {paymentsPagination && paymentsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Page {paymentsPagination.currentPage} of {paymentsPagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPayments(paymentsPage - 1)}
                    disabled={!paymentsPagination.hasPrevPage || paymentsLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPayments(paymentsPage + 1)}
                    disabled={!paymentsPagination.hasNextPage || paymentsLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
