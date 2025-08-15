"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, BookOpen, Trash2 } from "lucide-react"
import { CreateSubjectDialog } from "./create-subject-dialog"
import { EditSubjectDialog } from "./edit-subject-dialog"
import { useToast } from "@/hooks/use-toast"

interface Batch {
  id: string
  name: string
  isActive: boolean
}

interface Class {
  id: string
  name: string
  section: string | null
  batchId: string
  batch: {
    name: string
  }
}

interface Subject {
  id: string
  name: string
  code: string | null
  type: string
  isActive: boolean
  createdAt: string
  class: {
    id: string
    name: string
    section: string | null
    batch: {
      name: string
    }
  }
}

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all")
  const [selectedClassId, setSelectedClassId] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const { toast } = useToast()

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/batches")
      if (response.ok) {
        const data = await response.json()
        setBatches(data.filter((batch: Batch) => batch.isActive))
      }
    } catch (error) {
      console.error("Error fetching batches:", error)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBatchId !== "all") params.append("batchId", selectedBatchId)
      if (selectedClassId !== "all") params.append("classId", selectedClassId)

      const response = await fetch(`/api/subjects?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSubjects(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch subjects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchSubjects()
  }, [selectedBatchId, selectedClassId])

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject)
    setEditDialogOpen(true)
  }

  const handleDelete = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject deleted successfully",
        })
        fetchSubjects()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete subject")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subject",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (subjectId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Subject ${!isActive ? "activated" : "deactivated"} successfully`,
        })
        fetchSubjects()
      } else {
        throw new Error("Failed to update subject")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subject status",
        variant: "destructive",
      })
    }
  }

  const filteredClasses = classes.filter((cls) => (selectedBatchId === "all" ? true : cls.batchId === selectedBatchId))

  const getSubjectTypeColor = (type: string) => {
    switch (type) {
      case "CORE":
        return "default"
      case "ELECTIVE":
        return "secondary"
      case "EXTRA_CURRICULAR":
        return "outline"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading subjects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Subject Curriculum</h2>
          <p className="text-sm text-gray-600">Manage subjects for each class and batch</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
              <SelectTrigger>
                <SelectValue placeholder="All Batches" />
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
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {filteredClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                    {cls.section && ` - ${cls.section}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">
              <BookOpen className="mr-1 h-4 w-4" />
              {subjects.length} subjects found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
            <p className="text-gray-600 text-center mb-4">
              {selectedBatchId !== "all" || selectedClassId !== "all"
                ? "No subjects found for the selected filters."
                : "Add your first subject to start building the curriculum."}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Subject
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <Badge variant={subject.isActive ? "default" : "secondary"}>
                    {subject.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {subject.code && <p className="text-sm text-gray-600">Code: {subject.code}</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getSubjectTypeColor(subject.type)}>{subject.type.replace("_", " ")}</Badge>
                  <div className="text-sm text-gray-600">
                    {subject.class.name}
                    {subject.class.section && ` - ${subject.class.section}`}
                  </div>
                </div>

                <div className="text-sm text-gray-600">{subject.class.batch.name}</div>

                <div className="text-xs text-gray-500">Created {new Date(subject.createdAt).toLocaleDateString()}</div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(subject)} className="flex-1">
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant={subject.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(subject.id, subject.isActive)}
                    className="flex-1"
                  >
                    {subject.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(subject.id)}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateSubjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchSubjects}
        classes={classes}
      />

      <EditSubjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        subject={selectedSubject}
        onSuccess={fetchSubjects}
        classes={classes}
      />
    </div>
  )
}
