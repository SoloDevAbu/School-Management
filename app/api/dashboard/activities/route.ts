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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const batchId = searchParams.get("batchId")

    const skip = (page - 1) * limit

    // Build where clause for batch filtering
    const batchWhere = batchId ? {
      student: {
        studentClasses: {
          some: {
            isActive: true,
            class: {
              batchId: batchId,
            },
          },
        },
      },
    } : {}

    // Get total count for pagination
    const totalCount = await prisma.studentLog.count({
      where: batchWhere,
    })

    // Get recent activities with pagination
    const activities = await prisma.studentLog.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      where: batchWhere,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    const totalPages = Math.ceil(totalCount / limit)

    const response = {
      activities: activities.map(activity => ({
        id: activity.id,
        studentName: `${activity.student.firstName} ${activity.student.lastName}`,
        studentRoll: activity.student.admissionNumber,
        action: activity.action,
        field: activity.field,
        user: activity.user?.name || "System",
        createdAt: activity.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
