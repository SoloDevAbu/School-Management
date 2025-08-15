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
    const classId = searchParams.get("classId")

    const whereClause: any = {}

    if (classId) {
      whereClause.classId = classId
    } else if (batchId) {
      whereClause.class = {
        batchId,
      }
    }

    const subjects = await prisma.subject.findMany({
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

    return NextResponse.json(subjects)
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, code, type, classId } = await request.json()

    // Validate input
    if (!name || !classId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if subject with same name already exists in this class
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name,
        classId,
      },
    })

    if (existingSubject) {
      return NextResponse.json({ error: "Subject with this name already exists in this class" }, { status: 400 })
    }

    // Create subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code: code || null,
        type,
        classId,
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

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
