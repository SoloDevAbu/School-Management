"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface Student {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
  studentClasses: {
    id: string
    isActive: boolean
    class: {
      id: string
      name: string
      section: string | null
      batch: {
        id: string
        name: string
      }
    }
  }[]
  feeCollections: FeePayment[]
}

interface FeePayment {
  id: string
  amountPaid: number
  paymentDate: string
  paymentMethod: string
  status: string
  remarks?: string
  feeStructures: {
    feeStructureId: string
    feeCollectionId: string
  }[]
}

interface PaymentHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
}

export default function PaymentHistoryDialog({ open, onOpenChange, student }: PaymentHistoryDialogProps) {
  const [payments, setPayments] = useState<FeePayment[]>([])

  useEffect(() => {
    if (student) {
      setPayments(
        (student.feeCollections ?? []).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()),
      )
    }
  }, [student])

  if (!student) return null

  const totalPaid = payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + Number(payment.amountPaid), 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {student.firstName} {student.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Roll Number</p>
                  <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Class</p>
                  <p className="text-sm text-muted-foreground">
                    {student.studentClasses.find(sc => sc.isActive)?.class.name || 'No Class'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Paid</p>
                  <p className="text-lg font-semibold text-green-600">₹{totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payment history found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      {/* <TableHead>Fee Type</TableHead> */}
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</TableCell>
                        {/* <TableCell>{payment.feeStructure.feeType}</TableCell> */}
                        <TableCell>₹{payment.amountPaid.toLocaleString()}</TableCell>
                        <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{payment.remarks || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
