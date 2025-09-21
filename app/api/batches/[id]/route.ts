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

    const { name, startYear, endYear, isActive } = await request.json()
    const { id: batchId } = await params

    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id: batchId },
    })

    if (!existingBatch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    // If updating name, check if new name is already taken
    if (name && name !== existingBatch.name) {
      const nameTaken = await prisma.batch.findFirst({
        where: {
          name,
          id: { not: batchId },
        },
      })

      if (nameTaken) {
        return NextResponse.json({ error: "Batch name already taken" }, { status: 400 })
      }
    }

    // Validate years if provided
    if (startYear && endYear && Number.parseInt(endYear) <= Number.parseInt(startYear)) {
      return NextResponse.json({ error: "End year must be greater than start year" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (startYear !== undefined) updateData.startYear = Number.parseInt(startYear)
    if (endYear !== undefined) updateData.endYear = Number.parseInt(endYear)
    if (isActive !== undefined) updateData.isActive = isActive

    // Update batch
    const batch = await prisma.batch.update({
      where: { id: batchId },
      data: updateData,
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
    })

    return NextResponse.json(batch)
  } catch (error) {
    console.error("Error updating batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: batchId } = await params

    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
    })

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    // Check if batch has associated classes
    if (batch._count.classes > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete batch with associated classes. Please delete all classes first.",
        },
        { status: 400 },
      )
    }

    // Delete batch
    await prisma.batch.delete({
      where: { id: batchId },
    })

    return NextResponse.json({ message: "Batch deleted successfully" })
  } catch (error) {
    console.error("Error deleting batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
