"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

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

interface CollectFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  feeStructures: FeeStructure[]
  onSuccess: () => void
}

export default function CollectFeeDialog({
  open,
  onOpenChange,
  student,
  feeStructures,
  onSuccess,
}: CollectFeeDialogProps) {
  const [amount, setAmount] = useState<Number>(0)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const [applicableFees, setApplicableFees] = useState<FeeStructure[]>([])
  const [totalDue, setTotalDue] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)

  useEffect(() => {
    if (student) {
      const activeClass = student.studentClasses.find((sc) => sc.isActive)
      if (!activeClass) {
        setApplicableFees([])
        setTotalDue(0)
        setTotalPaid(0)
        setAmount(0)
        return
      }

      const fees = feeStructures.filter(
        (fee) => fee.class.name === activeClass.class.name && fee.class.batch.name === activeClass.class.batch.name,
      )
      setApplicableFees(fees)

      const due = fees.reduce((sum, fee) => sum + Number(fee.amount), 0)
      const paid = (student.feePayments ?? [])
        .filter((payment) => payment.status === "PAID")
        .reduce((sum, payment) => sum + Number(payment.amount), 0)

      setTotalDue(due)
      setTotalPaid(paid)
      setAmount(due - paid)
    }
  }, [student, feeStructures])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student || !amount || !paymentMethod) return
    
    const activeClass = student.studentClasses.find((sc) => sc.isActive)
    if (!activeClass) {
      toast.error("Student is not enrolled in any active class")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/fee-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student.id,
          amount: Number.parseFloat(amount.toString()),
          paymentMethod,
          remarks,
          feeStructureIds: applicableFees.map((fee) => fee.id),
        }),
      })

      if (response.ok) {
        toast.success("Fee payment recorded successfully")
        onSuccess()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to record payment")
      }
    } catch (error) {
      toast.error("Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAmount(0)
    setPaymentMethod("")
    setRemarks("")
  }

  if (!student) return null

  const activeClass = student.studentClasses.find((sc) => sc.isActive)
  const outstandingAmount = totalDue - totalPaid

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Collect Fee Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning if no active class */}
          {!activeClass && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-800">
                  This student is not currently enrolled in any active class. Fee collection is not available.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {student.firstName} {student.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Roll Number</Label>
                  <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Class</Label>
                  <p className="text-sm text-muted-foreground">
                    {student.studentClasses.find(sc => sc.isActive)?.class.name || 'No Class'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Batch</Label>
                  <p className="text-sm text-muted-foreground">
                    {student.studentClasses.find(sc => sc.isActive)?.class.batch.name || 'No Batch'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fee Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Total Due</Label>
                  <p className="text-lg font-semibold">₹{totalDue.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Paid</Label>
                  <p className="text-lg font-semibold text-green-600">₹{totalPaid.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Outstanding</Label>
                  <p className="text-lg font-semibold text-red-600">₹{outstandingAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className={`space-y-4 ${!activeClass ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount.toString()}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
