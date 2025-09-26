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

    const result = await prisma.$transaction(async (tx) => {
      const feePayment = await tx.feeCollection.create({
        data: {
          studentId,
          amountPaid: Number.parseFloat(amount),
          paymentMethod,
          remarks,
          status: "PAID",
          paymentDate: new Date(),
          collectedById: session.user.id,
        }
      })

      for (const fsId of feeStructureIds) {
        await tx.feeCollectionStructure.create({
          data: {
            feeCollectionId: feePayment.id,
            feeStructureId: fsId,
          },
        })
      }
  
      // Create audit log
      await tx.studentLog.create({
        data: {
          studentId,
          field: "FeePayment",
          action: "CREATE",
          userId: session.user.id,
        },
      })

      return feePayment;
    })

    return NextResponse.json(result)
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

    const feePayments = await prisma.feeCollection.findMany({
      where,
      include: {
        student: {
          include: {
            studentClasses: {
              include: {
                class: {
                  include: {
                    batch: true,
                  },
                },
              },
            },
          },
        },
        feeStructures: {
          include: {
            feeStructure: true,
          },
        },
        collectedBy: {
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
