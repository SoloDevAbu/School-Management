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

    const { name, amount, type, classId, dueDate, isActive } = await request.json()
    const feeStructureId = params.id

    // Check if fee structure exists
    const existingFeeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    })

    if (!existingFeeStructure) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 })
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    // If updating name or class, check for duplicates
    if ((name && name !== existingFeeStructure.name) || (classId && classId !== existingFeeStructure.classId)) {
      const checkName = name || existingFeeStructure.name
      const checkClassId = classId || existingFeeStructure.classId

      const duplicate = await prisma.feeStructure.findFirst({
        where: {
          name: checkName,
          classId: checkClassId,
          id: { not: feeStructureId },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "Fee structure with this name already exists in this class" },
          { status: 400 },
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (amount !== undefined) updateData.amount = amount
    if (type !== undefined) updateData.type = type
    if (classId !== undefined) updateData.classId = classId
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (isActive !== undefined) updateData.isActive = isActive

    // Update fee structure
    const feeStructure = await prisma.feeStructure.update({
      where: { id: feeStructureId },
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

    return NextResponse.json(feeStructure)
  } catch (error) {
    console.error("Error updating fee structure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const feeStructureId = params.id

    // Check if fee structure exists
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: {
        _count: {
          select: {
            feeCollections: true,
          },
        },
      },
    })

    if (!feeStructure) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 })
    }

    // Check if fee structure has associated collections
    if (feeStructure._count.feeCollections > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete fee structure with associated fee collections. Please remove collections first.",
        },
        { status: 400 },
      )
    }

    // Delete fee structure
    await prisma.feeStructure.delete({
      where: { id: feeStructureId },
    })

    return NextResponse.json({ message: "Fee structure deleted successfully" })
  } catch (error) {
    console.error("Error deleting fee structure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
