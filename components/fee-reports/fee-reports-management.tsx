"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, TrendingUp, Users, IndianRupee } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface ReportData {
  summary: {
    totalStudents: number
    totalDue: number
    totalCollected: number
    outstandingAmount: number
    collectionPercentage: number
  }
  classWiseData: Array<{
    className: string
    batchName: string
    totalStudents: number
    totalDue: number
    totalCollected: number
    outstanding: number
    collectionPercentage: number
  }>
  recentPayments: Array<{
    id: string
    studentName: string
    className: string
    amount: number
    paymentDate: string
    paymentMethod: string
    status: string
  }>
}

export default function FeeReportsManagement() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<string>("all")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [reportType, setReportType] = useState<string>("summary")
  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<string[]>([])
  const [classes, setClasses] = useState<string[]>([])

  useEffect(() => {
    fetchReportData()
    fetchFilters()
  }, [selectedBatch, selectedClass, reportType])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBatch !== "all") params.append("batch", selectedBatch)
      if (selectedClass !== "all") params.append("class", selectedClass)
      params.append("type", reportType)

      const response = await fetch(`/api/fee-reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      toast.error("Failed to fetch report data")
    } finally {
      setLoading(false)
    }
  }

  const fetchFilters = async () => {
    try {
      const [batchesRes, classesRes] = await Promise.all([fetch("/api/batches"), fetch("/api/classes")])

      if (batchesRes.ok) {
        const batchData = await batchesRes.json()
        setBatches(batchData.map((b: { name: string }) => b.name))
      }

      if (classesRes.ok) {
        const classData = await classesRes.json() as { name: string }[]
        setClasses([...new Set(classData.map((c) => c.name))])
      }
    } catch (error) {
      toast.error("Failed to fetch filter options")
    }
  }

  const exportReport = async (format: "pdf" | "excel") => {
    try {
      const params = new URLSearchParams()
      if (selectedBatch !== "all") params.append("batch", selectedBatch)
      if (selectedClass !== "all") params.append("class", selectedClass)
      params.append("type", reportType)
      params.append("format", format)

      const response = await fetch(`/api/fee-reports/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `fee-report-${format}-${Date.now()}.${format === "pdf" ? "pdf" : "xlsx"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Report exported as ${format.toUpperCase()}`)
      }
    } catch (error) {
      toast.error("Failed to export report")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading students...</div>
      </div>
    )
  }

  if (!reportData) {
    return <div>No report data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detailed">Detailed Report</SelectItem>
                <SelectItem value="outstanding">Outstanding Fees</SelectItem>
                <SelectItem value="collection">Collection Report</SelectItem>
              </SelectContent>
            </Select> */}
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch} value={batch}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              {/* <Button variant="outline" onClick={() => exportReport("excel")} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={() => exportReport("pdf")} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export PDF
              </Button> */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{reportData.summary.totalDue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{reportData.summary.totalCollected.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <IndianRupee className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{reportData.summary.outstandingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class-wise Report */}
      <Card>
        <CardHeader>
          <CardTitle>Class-wise Fee Collection Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.classWiseData.map((classData, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{classData.className}</TableCell>
                  <TableCell>{classData.batchName}</TableCell>
                  <TableCell>{classData.totalStudents}</TableCell>
                  <TableCell>₹{classData.totalDue.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">₹{classData.totalCollected.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">₹{classData.outstanding.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                {/* <TableHead>Class</TableHead> */}
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.recentPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="font-medium">{payment.studentName}</TableCell>
                  {/* <TableCell>{payment.className}</TableCell> */}
                  <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        payment.status === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
