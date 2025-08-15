import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, code, type, classId, isActive } = await request.json()
    const subjectId = params.id

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
    })

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // If updating name or class, check for duplicates
    if ((name && name !== existingSubject.name) || (classId && classId !== existingSubject.classId)) {
      const checkName = name || existingSubject.name
      const checkClassId = classId || existingSubject.classId

      const duplicate = await prisma.subject.findFirst({
        where: {
          name: checkName,
          classId: checkClassId,
          id: { not: subjectId },
        },
      })

      if (duplicate) {
        return NextResponse.json({ error: "Subject with this name already exists in this class" }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code || null
    if (type !== undefined) updateData.type = type
    if (classId !== undefined) updateData.classId = classId
    if (isActive !== undefined) updateData.isActive = isActive

    // Update subject
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: updateData,
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
    })

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Error updating subject:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subjectId = params.id

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        _count: {
          select: {
            studentSubjects: true,
          },
        },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check if subject has associated student enrollments
    if (subject._count.studentSubjects > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete subject with enrolled students. Please remove student enrollments first.",
        },
        { status: 400 },
      )
    }

    // Delete subject
    await prisma.subject.delete({
      where: { id: subjectId },
    })

    return NextResponse.json({ message: "Subject deleted successfully" })
  } catch (error) {
    console.error("Error deleting subject:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
