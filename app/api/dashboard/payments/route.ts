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
    const totalCount = await prisma.feeCollection.count({
      where: batchWhere,
    })

    // Get recent payments with pagination
    const payments = await prisma.feeCollection.findMany({
      skip,
      take: limit,
      orderBy: {
        paymentDate: "desc",
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
      },
    })

    const totalPages = Math.ceil(totalCount / limit)

    const response = {
      payments: payments.map(payment => ({
        id: payment.id,
        studentName: `${payment.student.firstName} ${payment.student.lastName}`,
        studentRoll: payment.student.admissionNumber,
        amount: payment.amountPaid,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
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
    console.error("Error fetching payments:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
