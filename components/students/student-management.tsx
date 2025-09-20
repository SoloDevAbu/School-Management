"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Eye, Edit, Users, GraduationCap } from "lucide-react"
import { CreateStudentDialog } from "./create-student-dialog"
import { StudentDetailDialog } from "./student-detail-dialog"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  admissionNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  gender: string | null
  email: string | null
  phone: string | null
  address: string | null
  guardianName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  profilePictures: string[]
  isActive: boolean
  createdAt: string
  studentClasses: {
    id: string
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
  }[]
}

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
  batchId: string
  batch: {
    name: string
    startYear: number
    endYear: number
  }
}

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all")
  const [selectedClassId, setSelectedClassId] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
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
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBatchId !== "all") params.append("batchId", selectedBatchId)
      if (selectedClassId !== "all") params.append("classId", selectedClassId)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/students?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
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
    fetchStudents()
  }, [selectedBatchId, selectedClassId, searchTerm])

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setDetailDialogOpen(true)
  }

  const getStudentInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getActiveClass = (student: Student) => {
    const activeClass = student.studentClasses.find((sc) => sc.isActive)
    return activeClass ? activeClass.class : null
  }

  const filteredClasses = classes.filter((cls) => (selectedBatchId === "all" ? true : cls.batchId === selectedBatchId))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Student Profiles</h2>
          {/* <p className="text-sm text-gray-600">Manage student information and enrollment</p> */}
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Student
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
                    {cls.batch && ` (${cls.batch.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">
              <Users className="mr-1 h-4 w-4" />
              {students.length} students found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Grid */}
      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm || selectedBatchId !== "all" || selectedClassId !== "all"
                ? "Try adjusting your filters or search terms."
                : "Add your first student to get started with student management."}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map((student) => {
            const activeClass = getActiveClass(student)
            return (
              <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={student.profilePictures[0] || "/placeholder.svg"}
                        alt={`${student.firstName} ${student.lastName}`}
                      />
                      <AvatarFallback>{getStudentInitials(student.firstName, student.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <p className="text-sm text-gray-600 truncate">{student.admissionNumber}</p>
                    </div>
                    <Badge variant={student.isActive ? "default" : "secondary"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeClass && (
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {activeClass.name}
                        {activeClass.section && ` - ${activeClass.section}`}
                      </p>
                      <p className="text-gray-600">{activeClass.batch.name}</p>
                    </div>
                  )}

                  {student.email && (
                    <p className="text-sm text-gray-600 truncate" title={student.email}>
                      {student.email}
                    </p>
                  )}

                  {student.phone && <p className="text-sm text-gray-600">{student.phone}</p>}

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewStudent(student)} className="flex-1">
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateStudentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchStudents}
        batches={batches}
        classes={classes}
      />

      <StudentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        student={selectedStudent}
        onUpdate={fetchStudents}
      />
    </div>
  )
}
