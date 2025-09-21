import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session as any).user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get("batchId")

    // Get all batches to find the most recent one
    const batches = await prisma.batch.findMany({
      orderBy: {
        startYear: "desc",
      },
      select: {
        id: true,
        name: true,
        startYear: true,
        endYear: true,
      },
    })

    // Use provided batchId or default to the most recent batch
    const selectedBatchId = batchId || (batches.length > 0 ? batches[0].id : null)

    // Build where clause for batch filtering
    const batchWhere = selectedBatchId ? { batchId: selectedBatchId } : {}

    // Get total students (all students)
    const totalStudents = await prisma.student.count()

    // Get total classes (all classes)
    const totalClasses = await prisma.class.count()

    // Get active classes (filtered by batch if specified)
    const activeClasses = await prisma.class.count({
      where: {
        ...batchWhere,
        isActive: true,
      },
    })

    // Get total staff members
    const totalStaff = await prisma.user.count({
      where: {
        role: {
          in: ["ADMIN", "STAFF"],
        },
      },
    })

    // Get total collected fees (all time)
    const totalCollectedFees = await prisma.feeCollection.aggregate({
      _sum: {
        amountPaid: true,
      },
      where: {
        status: "PAID",
      },
    })

    // Get students in selected batch
    const studentsInBatch = await prisma.student.count({
      where: {
        studentClasses: {
          some: {
            isActive: true,
            class: batchWhere,
          },
        },
      },
    })


    // Get fee collection statistics for the selected batch
    const batchFeeStats = selectedBatchId ? await prisma.feeCollection.aggregate({
      _sum: {
        amountPaid: true,
      },
      where: {
        status: "PAID",
        student: {
          studentClasses: {
            some: {
              isActive: true,
              class: {
                batchId: selectedBatchId,
              },
            },
          },
        },
      },
    }) : { _sum: { amountPaid: 0 } }

    const dashboardData = {
      summary: {
        totalStudents,
        totalClasses,
        activeClasses,
        totalStaff,
        totalCollectedFees: Number(totalCollectedFees._sum.amountPaid || 0),
        studentsInBatch,
        batchCollectedFees: Number(batchFeeStats._sum.amountPaid || 0),
      },
      batches,
      selectedBatch: batches.find(b => b.id === selectedBatchId) || null,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
