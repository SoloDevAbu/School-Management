"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Batch {
  id: string
  name: string
  isActive: boolean
}

interface CreateClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  batches: Batch[]
}

export function CreateClassDialog({ open, onOpenChange, onSuccess, batches }: CreateClassDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    section: "",
    batchId: "",
    capacity: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.batchId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const requestData = {
        name: formData.name,
        section: formData.section || null,
        batchId: formData.batchId,
        capacity: formData.capacity ? Number.parseInt(formData.capacity) : null,
      }

      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Class created successfully",
        })
        setFormData({
          name: "",
          section: "",
          batchId: "",
          capacity: "",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create class")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create class",
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
          <DialogTitle>Create New Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchId">Academic Batch *</Label>
            <Select value={formData.batchId} onValueChange={(value) => setFormData({ ...formData, batchId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Grade 1, Class 10, Nursery"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section (Optional)</Label>
            <Input
              id="section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="e.g., A, B, C"
            />
            <p className="text-xs text-gray-500">Leave blank if no sections are needed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Class Capacity (Optional)</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="e.g., 30"
              min="1"
            />
            <p className="text-xs text-gray-500">Maximum number of students in this class</p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Class
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
