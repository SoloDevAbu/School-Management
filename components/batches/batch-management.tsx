"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Calendar, Users } from "lucide-react"
import { CreateBatchDialog } from "./create-batch-dialog"
import { EditBatchDialog } from "./edit-batch-dialog"
import { useToast } from "@/hooks/use-toast"

interface Batch {
  id: string
  name: string
  startYear: number
  endYear: number
  isActive: boolean
  createdAt: string
  _count: {
    classes: number
  }
}

export function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const { toast } = useToast()

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/batches")
      if (response.ok) {
        const data = await response.json()
        setBatches(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch batches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch)
    setEditDialogOpen(true)
  }

  const handleToggleActive = async (batchId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Batch ${!isActive ? "activated" : "deactivated"} successfully`,
        })
        fetchBatches()
      } else {
        throw new Error("Failed to update batch")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update batch status",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading batches...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Academic Batches</h2>
          <p className="text-sm text-gray-600">Manage academic year batches and their status</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Batch
        </Button>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first academic batch to get started with managing classes and students.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{batch.name}</CardTitle>
                  <Badge variant={batch.isActive ? "default" : "secondary"}>
                    {batch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {batch.startYear} - {batch.endYear}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{batch._count.classes} Classes</span>
                  </div>
                  <div className="text-gray-500">Created {new Date(batch.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(batch)} className="flex-1">
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant={batch.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(batch.id, batch.isActive)}
                    className="flex-1"
                  >
                    {batch.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateBatchDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={fetchBatches} />

      <EditBatchDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        batch={selectedBatch}
        onSuccess={fetchBatches}
      />
    </div>
  )
}
