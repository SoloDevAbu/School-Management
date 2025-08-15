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

interface CreateBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateBatchDialog({ open, onOpenChange, onSuccess }: CreateBatchDialogProps) {
  const currentYear = new Date().getFullYear()
  const [formData, setFormData] = useState({
    name: "",
    startYear: currentYear,
    endYear: currentYear + 1,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Generate year options (current year - 5 to current year + 10)
  const yearOptions = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.endYear <= formData.startYear) {
      toast({
        title: "Error",
        description: "End year must be greater than start year",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch created successfully",
        })
        setFormData({
          name: "",
          startYear: currentYear,
          endYear: currentYear + 1,
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create batch")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create batch",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateBatchName = () => {
    const name = `${formData.startYear}-${formData.endYear}`
    setFormData({ ...formData, name })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Academic Batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startYear">Start Year</Label>
              <Select
                value={formData.startYear.toString()}
                onValueChange={(value) => {
                  const startYear = Number.parseInt(value)
                  setFormData({
                    ...formData,
                    startYear,
                    endYear: Math.max(startYear + 1, formData.endYear),
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endYear">End Year</Label>
              <Select
                value={formData.endYear.toString()}
                onValueChange={(value) => setFormData({ ...formData, endYear: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions
                    .filter((year) => year > formData.startYear)
                    .map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="name">Batch Name</Label>
              <Button type="button" variant="outline" size="sm" onClick={generateBatchName}>
                Auto Generate
              </Button>
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 2024-2025"
              required
            />
            <p className="text-xs text-gray-500">Typically formatted as "StartYear-EndYear" (e.g., 2024-2025)</p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Batch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
