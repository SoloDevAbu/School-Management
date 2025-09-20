"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, BookOpen, Users, Copy } from "lucide-react"
import { CreateClassDialog } from "./create-class-dialog"
import { EditClassDialog } from "./edit-class-dialog"
import { ImportClassesDialog } from "./import-classes-dialog"
import { useToast } from "@/hooks/use-toast"

interface Batch {
  id: string
  name: string
  startYear: number
  endYear: number
  isActive: boolean
}

interface Class {
  id: string
  name: string
  section: string | null
  capacity: number | null
  isActive: boolean
  batchId: string
  createdAt: string
  batch: {
    name: string
    startYear: number
    endYear: number
  }
  _count: {
    subjects: number
    studentClasses: number
  }
}

export function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const { toast } = useToast()

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/batches")
      if (response.ok) {
        const data = await response.json()
        const activeBatches = data.filter((batch: Batch) => batch.isActive)
        activeBatches.sort((a: Batch, b: Batch) => b.startYear - a.startYear)

        setBatches(activeBatches)

        if (activeBatches.length > 0) {
          setSelectedBatchId(activeBatches[0].id);
        } else {
          setSelectedBatchId("all");
        }
        
      }
    } catch (error) {
      console.error("Error fetching batches:", error)
    }
  }

  const fetchClasses = async () => {
    try {
      const url = selectedBatchId === "all" ? "/api/classes" : `/api/classes?batchId=${selectedBatchId}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [selectedBatchId])

  const handleEdit = (classItem: Class) => {
    setSelectedClass(classItem)
    setEditDialogOpen(true)
  }

  const handleToggleActive = async (classId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Class ${!isActive ? "activated" : "deactivated"} successfully`,
        })
        fetchClasses()
      } else {
        throw new Error("Failed to update class")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update class status",
        variant: "destructive",
      })
    }
  }

  const filteredClasses = classes.filter((classItem) =>
    selectedBatchId === "all" ? true : classItem.batchId === selectedBatchId,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading classes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Classes</h2>
          {/* <p className="text-sm text-gray-600">Manage classes and sections for each batch</p> */}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            disabled={!selectedBatchId || selectedBatchId === "all"}
          >
            <Copy className="mr-2 h-4 w-4" />
            Import Classes
          </Button> */}
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-600 text-center mb-4">
              {selectedBatchId === "all"
                ? "Create your first class to get started with organizing students."
                : "No classes found for the selected batch. Create a new class or import from previous batch."}
            </p>
            <div className="flex gap-2">
              {selectedBatchId !== "all" && (
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Import Classes
                </Button>
              )}
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Class
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {classItem.name}
                    {classItem.section && (
                      <span className="text-sm font-normal text-gray-600"> - {classItem.section}</span>
                    )}
                  </CardTitle>
                  <Badge variant={classItem.isActive ? "default" : "secondary"}>
                    {classItem.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{classItem.batch.name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{classItem._count.studentClasses} Students</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <BookOpen className="mr-1 h-4 w-4" />
                    <span>{classItem._count.subjects} Subjects</span>
                  </div>
                </div>

                {classItem.capacity && (
                  <div className="text-sm text-gray-600">
                    Capacity: {classItem._count.studentClasses}/{classItem.capacity}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created {new Date(classItem.createdAt).toLocaleDateString()}
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(classItem)} className="flex-1">
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant={classItem.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(classItem.id, classItem.isActive)}
                    className="flex-1"
                  >
                    {classItem.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateClassDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchClasses}
        batches={batches}
      />

      <EditClassDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        classItem={selectedClass}
        onSuccess={fetchClasses}
        batches={batches}
      />

      <ImportClassesDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        targetBatchId={selectedBatchId === "all" ? "" : selectedBatchId}
        onSuccess={fetchClasses}
        batches={batches}
      />
    </div>
  )
}
