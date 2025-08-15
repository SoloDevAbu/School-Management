"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import CollectFeeDialog from "./collect-fee-dialog"
import PaymentHistoryDialog from "./payment-history-dialog"

interface Student {
  id: string
  firstName: string
  lastName: string
  rollNumber: string
  class: {
    name: string
    batch: {
      name: string
    }
  }
  feePayments: FeePayment[]
}

interface FeePayment {
  id: string
  amount: number
  paymentDate: string
  paymentMethod: string
  status: string
  feeStructure: {
    feeType: string
    amount: number
    dueDate: string
  }
}

interface FeeStructure {
  id: string
  feeType: string
  amount: number
  dueDate: string
  class: {
    name: string
    batch: {
      name: string
    }
  }
}

export default function FeeCollectionManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBatch, setSelectedBatch] = useState<string>("all")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [collectFeeOpen, setCollectFeeOpen] = useState(false)
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    fetchStudents()
    fetchFeeStructures()
  }, [])

  useEffect(() => {
    filterStudents()
  }, [students, searchTerm, selectedBatch, selectedClass, selectedStatus])

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students?include=feePayments")
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      toast.error("Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }

  const fetchFeeStructures = async () => {
    try {
      const response = await fetch("/api/fee-structures")
      if (response.ok) {
        const data = await response.json()
        setFeeStructures(data)
      }
    } catch (error) {
      toast.error("Failed to fetch fee structures")
    }
  }

  const filterStudents = () => {
    let filtered = students

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedBatch !== "all") {
      filtered = filtered.filter((student) => student.class.batch.name === selectedBatch)
    }

    if (selectedClass !== "all") {
      filtered = filtered.filter((student) => student.class.name === selectedClass)
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((student) => {
        const paymentStatus = getPaymentStatus(student)
        return paymentStatus === selectedStatus
      })
    }

    setFilteredStudents(filtered)
  }

  const getPaymentStatus = (student: Student) => {
    const currentDate = new Date()
    const applicableFees = feeStructures.filter(
      (fee) => fee.class.name === student.class.name && fee.class.batch.name === student.class.batch.name,
    )

    if (applicableFees.length === 0) return "no-fees"

    const paidFees = student.feePayments.filter((payment) => payment.status === "PAID")
    const totalDue = applicableFees.reduce((sum, fee) => sum + fee.amount, 0)
    const totalPaid = paidFees.reduce((sum, payment) => sum + payment.amount, 0)

    if (totalPaid >= totalDue) return "paid"

    const hasOverdue = applicableFees.some((fee) => new Date(fee.dueDate) < currentDate)
    if (hasOverdue && totalPaid < totalDue) return "overdue"

    return "pending"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="secondary">No Fees</Badge>
    }
  }

  const getOutstandingAmount = (student: Student) => {
    const applicableFees = feeStructures.filter(
      (fee) => fee.class.name === student.class.name && fee.class.batch.name === student.class.batch.name,
    )
    const totalDue = applicableFees.reduce((sum, fee) => sum + fee.amount, 0)
    const totalPaid = student.feePayments
      .filter((payment) => payment.status === "PAID")
      .reduce((sum, payment) => sum + payment.amount, 0)

    return Math.max(0, totalDue - totalPaid)
  }

  const uniqueBatches = [...new Set(students.map((s) => s.class.batch.name))]
  const uniqueClasses = [...new Set(students.map((s) => s.class.name))]

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {students.filter((s) => getPaymentStatus(s) === "paid").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {students.filter((s) => getPaymentStatus(s) === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {students.filter((s) => getPaymentStatus(s) === "overdue").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {uniqueBatches.map((batch) => (
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
                {uniqueClasses.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {student.firstName} {student.lastName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.class.name}</TableCell>
                  <TableCell>{student.class.batch.name}</TableCell>
                  <TableCell>{getStatusBadge(getPaymentStatus(student))}</TableCell>
                  <TableCell>₹{getOutstandingAmount(student).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student)
                          setCollectFeeOpen(true)
                        }}
                        disabled={getPaymentStatus(student) === "paid"}
                      >
                        Collect Fee
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student)
                          setPaymentHistoryOpen(true)
                        }}
                      >
                        History
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CollectFeeDialog
        open={collectFeeOpen}
        onOpenChange={setCollectFeeOpen}
        student={selectedStudent}
        feeStructures={feeStructures}
        onSuccess={() => {
          fetchStudents()
          setCollectFeeOpen(false)
        }}
      />

      <PaymentHistoryDialog open={paymentHistoryOpen} onOpenChange={setPaymentHistoryOpen} student={selectedStudent} />
    </div>
  )
}
