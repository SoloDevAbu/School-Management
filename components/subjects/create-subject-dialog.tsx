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

interface Class {
  id: string
  name: string
  section: string | null
  batchId: string
  batch: {
    name: string
  }
}

interface CreateSubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  classes: Class[]
}

export function CreateSubjectDialog({ open, onOpenChange, onSuccess, classes }: CreateSubjectDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "CORE",
    classId: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.classId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code || null,
          type: formData.type,
          classId: formData.classId,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject created successfully",
        })
        setFormData({
          name: "",
          code: "",
          type: "CORE",
          classId: "",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create subject")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subject",
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
          <DialogTitle>Add New Subject</DialogTitle>
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
            <Label htmlFor="name">Subject Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mathematics, English, Science"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Subject Code (Optional)</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., MATH101, ENG201"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Subject Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORE">Core Subject</SelectItem>
                <SelectItem value="ELECTIVE">Elective Subject</SelectItem>
                <SelectItem value="EXTRA_CURRICULAR">Extra Curricular</SelectItem>
                <SelectItem value="PRACTICAL">Practical Subject</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Subject
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
