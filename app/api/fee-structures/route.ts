import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
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

    const whereClause: any = {}

    if (classId) {
      whereClause.classId = classId
    } else if (batchId) {
      whereClause.class = {
        batchId,
      }
    }

    const feeStructures = await prisma.feeStructure.findMany({
      where: whereClause,
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
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
    })

    return NextResponse.json(feeStructures)
  } catch (error) {
    console.error("Error fetching fee structures:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, amount, type, classId, dueDate } = await request.json()

    // Validate input
    if (!name || !amount || !classId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if fee structure with same name already exists in this class
    const existingFeeStructure = await prisma.feeStructure.findFirst({
      where: {
        name,
        classId,
      },
    })

    if (existingFeeStructure) {
      return NextResponse.json({ error: "Fee structure with this name already exists in this class" }, { status: 400 })
    }

    // Create fee structure
    const feeStructure = await prisma.feeStructure.create({
      data: {
        name,
        amount,
        type,
        classId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
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
    console.error("Error creating fee structure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
