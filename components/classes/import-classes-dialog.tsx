"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Copy } from "lucide-react"

interface Batch {
  id: string
  name: string
  isActive: boolean
}

interface Class {
  id: string
  name: string
  section: string | null
  capacity: number | null
}

interface ImportClassesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetBatchId: string
  onSuccess: () => void
  batches: Batch[]
}

export function ImportClassesDialog({
  open,
  onOpenChange,
  targetBatchId,
  onSuccess,
  batches,
}: ImportClassesDialogProps) {
  const [sourceBatchId, setSourceBatchId] = useState("")
  const [availableClasses, setAvailableClasses] = useState<Class[]>([])
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingClasses, setFetchingClasses] = useState(false)
  const { toast } = useToast()

  const fetchClassesFromBatch = async (batchId: string) => {
    if (!batchId) return

    setFetchingClasses(true)
    try {
      const response = await fetch(`/api/classes?batchId=${batchId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableClasses(data)
        setSelectedClasses([])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classes from source batch",
        variant: "destructive",
      })
    } finally {
      setFetchingClasses(false)
    }
  }

  useEffect(() => {
    if (sourceBatchId) {
      fetchClassesFromBatch(sourceBatchId)
    } else {
      setAvailableClasses([])
      setSelectedClasses([])
    }
  }, [sourceBatchId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sourceBatchId || !targetBatchId || selectedClasses.length === 0) {
      toast({
        title: "Error",
        description: "Please select source batch and at least one class to import",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/classes/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceBatchId,
          targetBatchId,
          classIds: selectedClasses,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Successfully imported ${result.importedCount} classes`,
        })
        onOpenChange(false)
        onSuccess()
        setSourceBatchId("")
        setAvailableClasses([])
        setSelectedClasses([])
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to import classes")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import classes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses((prev) => (prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]))
  }

  const toggleSelectAll = () => {
    if (selectedClasses.length === availableClasses.length) {
      setSelectedClasses([])
    } else {
      setSelectedClasses(availableClasses.map((c) => c.id))
    }
  }

  const targetBatch = batches.find((b) => b.id === targetBatchId)
  const sourceBatches = batches.filter((b) => b.id !== targetBatchId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Classes</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Target Batch</Label>
            <div className="p-2 bg-gray-50 rounded border">{targetBatch ? targetBatch.name : "No batch selected"}</div>
            <p className="text-xs text-gray-500">Classes will be imported to this batch</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceBatch">Source Batch</Label>
            <Select value={sourceBatchId} onValueChange={setSourceBatchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select batch to import from" />
              </SelectTrigger>
              <SelectContent>
                {sourceBatches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fetchingClasses && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Loading classes...</span>
            </div>
          )}

          {availableClasses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Classes to Import</Label>
                <Button type="button" variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedClasses.length === availableClasses.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-2">
                {availableClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={classItem.id}
                      checked={selectedClasses.includes(classItem.id)}
                      onCheckedChange={() => toggleClassSelection(classItem.id)}
                    />
                    <Label htmlFor={classItem.id} className="text-sm cursor-pointer">
                      {classItem.name}
                      {classItem.section && ` - ${classItem.section}`}
                      {classItem.capacity && ` (Capacity: ${classItem.capacity})`}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">{selectedClasses.length} classes selected</p>
            </div>
          )}

          {sourceBatchId && availableClasses.length === 0 && !fetchingClasses && (
            <div className="text-center py-4 text-gray-500">
              <Copy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No classes found in the selected batch</p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedClasses.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {selectedClasses.length} Classes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
