import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const batches = await prisma.batch.findMany({
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { startYear: "desc" }],
    })

    return NextResponse.json(batches)
  } catch (error) {
    console.error("Error fetching batches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, startYear, endYear } = await request.json()

    // Validate input
    if (!name || !startYear || !endYear) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (endYear <= startYear) {
      return NextResponse.json({ error: "End year must be greater than start year" }, { status: 400 })
    }

    // Check if batch with same name already exists
    const existingBatch = await prisma.batch.findUnique({
      where: { name },
    })

    if (existingBatch) {
      return NextResponse.json({ error: "Batch with this name already exists" }, { status: 400 })
    }

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        name,
        startYear: Number.parseInt(startYear),
        endYear: Number.parseInt(endYear),
        createdById: session.user.id,
      },
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
    console.error("Error creating batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
