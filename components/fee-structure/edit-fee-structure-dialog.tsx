"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Class {
  id: string
  name: string
  section: string | null
  batchId: string
  batch: {
    name: string
  }
}

interface FeeStructure {
  id: string
  name: string
  amount: string
  type: string
  isActive: boolean
  dueDate: string | null
  class: {
    id: string
  }
}

interface EditFeeStructureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feeStructure: FeeStructure | null
  onSuccess: () => void
  classes: Class[]
}

export function EditFeeStructureDialog({
  open,
  onOpenChange,
  feeStructure,
  onSuccess,
  classes,
}: EditFeeStructureDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    type: "MONTHLY",
    classId: "",
    dueDate: "",
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (feeStructure) {
      setFormData({
        name: feeStructure.name,
        amount: feeStructure.amount,
        type: feeStructure.type,
        classId: feeStructure.class.id,
        dueDate: feeStructure.dueDate ? feeStructure.dueDate.split("T")[0] : "",
        isActive: feeStructure.isActive,
      })
    }
  }, [feeStructure])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feeStructure) return

    if (!formData.name || !formData.amount || !formData.classId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(formData.amount) <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/fee-structures/${feeStructure.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          amount: Number.parseFloat(formData.amount),
          type: formData.type,
          classId: formData.classId,
          dueDate: formData.dueDate || null,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Fee structure updated successfully",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update fee structure")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update fee structure",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Fee Structure</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="classId">Class *</Label>
            <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                    {cls.section && ` - ${cls.section}`} ({cls.batch.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Fee Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Tuition Fee, Library Fee, Lab Fee"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Fee Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="HALF_YEARLY">Half Yearly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
                <SelectItem value="ONE_TIME">One Time</SelectItem>
                <SelectItem value="TUITION">Tuition</SelectItem>
                <SelectItem value="LIBRARY">Library</SelectItem>
                <SelectItem value="LABORATORY">Laboratory</SelectItem>
                <SelectItem value="SPORTS">Sports</SelectItem>
                <SelectItem value="TRANSPORT">Transport</SelectItem>
                <SelectItem value="EXAMINATION">Examination</SelectItem>
                <SelectItem value="DEVELOPMENT">Development</SelectItem>
                <SelectItem value="MISCELLANEOUS">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active Fee Structure</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Fee Structure
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
