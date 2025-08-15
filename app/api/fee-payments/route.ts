import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { studentId, amount, paymentMethod, remarks, feeStructureIds } = await request.json()

    if (!studentId || !amount || !paymentMethod || !feeStructureIds?.length) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Create fee payment record
    const feePayment = await prisma.feePayment.create({
      data: {
        studentId,
        amount: Number.parseFloat(amount),
        paymentMethod,
        remarks,
        status: "PAID",
        paymentDate: new Date(),
        createdBy: session.user.id,
        // Link to the first fee structure for reference
        feeStructureId: feeStructureIds[0],
      },
      include: {
        student: {
          include: {
            class: {
              include: {
                batch: true,
              },
            },
          },
        },
        feeStructure: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "FeePayment",
        entityId: feePayment.id,
        changes: {
          studentId,
          amount,
          paymentMethod,
          status: "PAID",
        },
        userId: session.user.id,
      },
    })

    return NextResponse.json(feePayment)
  } catch (error) {
    console.error("Error creating fee payment:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    const where = studentId ? { studentId } : {}

    const feePayments = await prisma.feePayment.findMany({
      where,
      include: {
        student: {
          include: {
            class: {
              include: {
                batch: true,
              },
            },
          },
        },
        feeStructure: true,
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    })

    return NextResponse.json(feePayments)
  } catch (error) {
    console.error("Error fetching fee payments:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
