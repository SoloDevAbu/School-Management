import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get("batchId")
    const classId = searchParams.get("classId")
    const search = searchParams.get("search")

    const whereClause: any = {}

    // Filter by search term
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { admissionNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter by class or batch
    if (classId) {
      whereClause.studentClasses = {
        some: {
          classId,
          isActive: true,
        },
      }
    } else if (batchId) {
      whereClause.studentClasses = {
        some: {
          class: {
            batchId,
          },
          isActive: true,
        },
      }
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        studentClasses: {
          include: {
            class: {
              include: {
                batch: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        feeCollections: {
          include: {
            feeStructures: {
              select: {
                feeCollectionId: true,
                feeStructureId: true
              }
            }
          }
        }
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()

    // Extract form fields
    const studentData = {
      admissionNumber: formData.get("admissionNumber") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      gender: formData.get("gender") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      guardianName: formData.get("guardianName") as string,
      guardianPhone: formData.get("guardianPhone") as string,
      guardianEmail: formData.get("guardianEmail") as string,
      classId: formData.get("classId") as string,
    }

    // Validate required fields
    if (!studentData.admissionNumber || !studentData.firstName || !studentData.lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if admission number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { admissionNumber: studentData.admissionNumber },
    })

    if (existingStudent) {
      return NextResponse.json({ error: "Admission number already exists" }, { status: 400 })
    }

    // Handle profile pictures (in a real app, you'd upload to cloud storage)
    const profilePictures: string[] = []
    for (let i = 0; i < 5; i++) {
      const file = formData.get(`profilePicture_${i}`) as File
      if (file) {
        // In a real implementation, upload to cloud storage and get URL
        // For now, we'll use placeholder URLs
        profilePictures.push(`/placeholder.svg?height=200&width=200&query=student-${i}`)
      }
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        admissionNumber: studentData.admissionNumber,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : null,
        gender: studentData.gender || null,
        email: studentData.email || null,
        phone: studentData.phone || null,
        address: studentData.address || null,
        guardianName: studentData.guardianName || null,
        guardianPhone: studentData.guardianPhone || null,
        guardianEmail: studentData.guardianEmail || null,
        profilePictures,
      },
    })

    // Create student log
    await prisma.studentLog.create({
      data: {
        studentId: student.id,
        field: "student",
        newValue: "Student created",
        action: "CREATE",
        userId: session.user.id,
      },
    })

    // Assign to class if provided
    if (studentData.classId) {
      await prisma.studentClass.create({
        data: {
          studentId: student.id,
          classId: studentData.classId,
        },
      })

      await prisma.studentLog.create({
        data: {
          studentId: student.id,
          field: "class_assignment",
          newValue: studentData.classId,
          action: "CREATE",
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
