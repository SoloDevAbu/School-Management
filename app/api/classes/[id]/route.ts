import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, section, batchId, capacity, isActive } = await request.json()
    const { id: classId } = await params

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // If updating name/section/batch, check for duplicates
    if (name || section !== undefined || batchId) {
      const checkName = name || existingClass.name
      const checkSection = section !== undefined ? section || null : existingClass.section
      const checkBatchId = batchId || existingClass.batchId

      const duplicate = await prisma.class.findFirst({
        where: {
          name: checkName,
          section: checkSection,
          batchId: checkBatchId,
          id: { not: classId },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Class "${checkName}"${checkSection ? ` - ${checkSection}` : ""} already exists in this batch`,
          },
          { status: 400 },
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (section !== undefined) updateData.section = section || null
    if (batchId !== undefined) updateData.batchId = batchId
    if (capacity !== undefined) updateData.capacity = capacity || null
    if (isActive !== undefined) updateData.isActive = isActive

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: updateData,
      include: {
        batch: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            subjects: true,
            studentClasses: true,
          },
        },
      },
    })

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error("Error updating class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: classId } = await params

    // Check if class exists
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            subjects: true,
            studentClasses: true,
          },
        },
      },
    })

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if class has associated data
    if (classItem._count.subjects > 0 || classItem._count.studentClasses > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete class with associated subjects or students. Please remove them first.",
        },
        { status: 400 },
      )
    }

    // Delete class
    await prisma.class.delete({
      where: { id: classId },
    })

    return NextResponse.json({ message: "Class deleted successfully" })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
