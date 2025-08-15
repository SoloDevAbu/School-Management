import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
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

    const whereClause = batchId ? { batchId } : {}

    const classes = await prisma.class.findMany({
      where: whereClause,
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
      orderBy: [{ batch: { startYear: "desc" } }, { name: "asc" }],
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, section, batchId, capacity } = await request.json()

    // Validate input
    if (!name || !batchId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    })

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    // Check if class with same name and section already exists in this batch
    const existingClass = await prisma.class.findFirst({
      where: {
        name,
        section: section || null,
        batchId,
      },
    })

    if (existingClass) {
      return NextResponse.json(
        {
          error: `Class "${name}"${section ? ` - ${section}` : ""} already exists in this batch`,
        },
        { status: 400 },
      )
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        name,
        section: section || null,
        batchId,
        capacity: capacity || null,
        createdById: session.user.id,
      },
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

    return NextResponse.json(newClass)
  } catch (error) {
    console.error("Error creating class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
