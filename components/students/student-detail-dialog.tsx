"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Edit, Phone, Mail, MapPin, User, Calendar, History, BookOpen } from "lucide-react"
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

interface StudentLog {
  id: string
  field: string
  oldValue: string | null
  newValue: string | null
  action: string
  createdAt: string
  user: {
    name: string
  }
}

interface StudentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  onUpdate: () => void
}

export function StudentDetailDialog({ open, onOpenChange, student, onUpdate }: StudentDetailDialogProps) {
  const [studentLogs, setStudentLogs] = useState<StudentLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const { toast } = useToast()

  const fetchStudentLogs = async (studentId: string) => {
    setLoadingLogs(true)
    try {
      const response = await fetch(`/api/students/${studentId}/logs`)
      if (response.ok) {
        const data = await response.json()
        setStudentLogs(data)
      }
    } catch (error) {
      console.error("Error fetching student logs:", error)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (student && open) {
      fetchStudentLogs(student.id)
    }
  }, [student, open])

  if (!student) return null

  const getStudentInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const activeClass = student.studentClasses.find((sc) => sc.isActive)
  const classHistory = student.studentClasses.filter((sc) => !sc.isActive)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="profile" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="profile" className="h-full">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {/* Header */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex space-x-2">
                            {student.profilePictures.length > 0 ? (
                              student.profilePictures.map((pic, index) => (
                                <Avatar key={index} className="h-16 w-16">
                                  <AvatarImage
                                    src={pic || "/placeholder.svg"}
                                    alt={`${student.firstName} ${student.lastName}`}
                                  />
                                  <AvatarFallback>
                                    {getStudentInitials(student.firstName, student.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                              ))
                            ) : (
                              <Avatar className="h-16 w-16">
                                <AvatarFallback>
                                  {getStudentInitials(student.firstName, student.lastName)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h2 className="text-2xl font-bold">
                                  {student.firstName} {student.lastName}
                                </h2>
                                <p className="text-gray-600">{student.admissionNumber}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={student.isActive ? "default" : "secondary"}>
                                  {student.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button variant="outline" size="sm">
                                  <Edit className="mr-1 h-4 w-4" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <User className="mr-2 h-5 w-5" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {student.dateOfBirth && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-600">Date of Birth</p>
                                <p className="font-medium">{formatDate(student.dateOfBirth)}</p>
                              </div>
                            </div>
                          )}
                          {student.gender && (
                            <div>
                              <p className="text-sm text-gray-600">Gender</p>
                              <p className="font-medium">{student.gender}</p>
                            </div>
                          )}
                        </div>
                        {student.address && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">Address</p>
                              <p className="font-medium">{student.address}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {student.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{student.email}</p>
                              </div>
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-medium">{student.phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Guardian Information */}
                    {(student.guardianName || student.guardianPhone || student.guardianEmail) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Guardian Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {student.guardianName && (
                            <div>
                              <p className="text-sm text-gray-600">Guardian Name</p>
                              <p className="font-medium">{student.guardianName}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {student.guardianPhone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-600">Guardian Phone</p>
                                  <p className="font-medium">{student.guardianPhone}</p>
                                </div>
                              </div>
                            )}
                            {student.guardianEmail && (
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-600">Guardian Email</p>
                                  <p className="font-medium">{student.guardianEmail}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="academic" className="h-full">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {/* Current Class */}
                    {activeClass && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <BookOpen className="mr-2 h-5 w-5" />
                            Current Enrollment
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                {activeClass.class.name}
                                {activeClass.class.section && ` - ${activeClass.class.section}`}
                              </h3>
                              <p className="text-gray-600">{activeClass.class.batch.name}</p>
                              <p className="text-sm text-gray-500">Enrolled on {formatDate(activeClass.createdAt)}</p>
                            </div>
                            <Badge>Current</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Class History */}
                    {classHistory.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Class History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {classHistory.map((sc) => (
                              <div key={sc.id} className="flex items-center justify-between p-3 border rounded">
                                <div>
                                  <h4 className="font-medium">
                                    {sc.class.name}
                                    {sc.class.section && ` - ${sc.class.section}`}
                                  </h4>
                                  <p className="text-sm text-gray-600">{sc.class.batch.name}</p>
                                  <p className="text-xs text-gray-500">Enrolled on {formatDate(sc.createdAt)}</p>
                                </div>
                                <Badge variant="secondary">Previous</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="h-full">
                <ScrollArea className="h-[500px] pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <History className="mr-2 h-5 w-5" />
                        Change History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingLogs ? (
                        <div className="text-center py-4">Loading history...</div>
                      ) : studentLogs.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No changes recorded</div>
                      ) : (
                        <div className="space-y-3">
                          {studentLogs.map((log) => (
                            <div key={log.id} className="border-l-2 border-blue-200 pl-4 pb-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium capitalize">{log.action.toLowerCase()}</h4>
                                <span className="text-xs text-gray-500">{formatDateTime(log.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Field: <span className="font-medium">{log.field}</span>
                              </p>
                              {log.oldValue && (
                                <p className="text-sm text-gray-600">
                                  From: <span className="font-medium">{log.oldValue}</span>
                                </p>
                              )}
                              {log.newValue && (
                                <p className="text-sm text-gray-600">
                                  To: <span className="font-medium">{log.newValue}</span>
                                </p>
                              )}
                              <p className="text-xs text-gray-500">By: {log.user.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
