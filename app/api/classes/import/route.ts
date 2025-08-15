import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sourceBatchId, targetBatchId, classIds } = await request.json()

    // Validate input
    if (!sourceBatchId || !targetBatchId || !classIds || classIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if both batches exist
    const [sourceBatch, targetBatch] = await Promise.all([
      prisma.batch.findUnique({ where: { id: sourceBatchId } }),
      prisma.batch.findUnique({ where: { id: targetBatchId } }),
    ])

    if (!sourceBatch || !targetBatch) {
      return NextResponse.json({ error: "Source or target batch not found" }, { status: 404 })
    }

    // Get classes to import
    const classesToImport = await prisma.class.findMany({
      where: {
        id: { in: classIds },
        batchId: sourceBatchId,
      },
    })

    if (classesToImport.length === 0) {
      return NextResponse.json({ error: "No valid classes found to import" }, { status: 400 })
    }

    // Import classes
    const importedClasses = []
    const skippedClasses = []

    for (const sourceClass of classesToImport) {
      try {
        // Check if class with same name and section already exists in target batch
        const existingClass = await prisma.class.findFirst({
          where: {
            name: sourceClass.name,
            section: sourceClass.section,
            batchId: targetBatchId,
          },
        })

        if (existingClass) {
          skippedClasses.push({
            name: sourceClass.name,
            section: sourceClass.section,
            reason: "Already exists",
          })
          continue
        }

        // Create new class in target batch
        const newClass = await prisma.class.create({
          data: {
            name: sourceClass.name,
            section: sourceClass.section,
            capacity: sourceClass.capacity,
            batchId: targetBatchId,
            createdById: session.user.id,
          },
        })

        importedClasses.push(newClass)
      } catch (error) {
        console.error(`Error importing class ${sourceClass.name}:`, error)
        skippedClasses.push({
          name: sourceClass.name,
          section: sourceClass.section,
          reason: "Import failed",
        })
      }
    }

    return NextResponse.json({
      message: "Import completed",
      importedCount: importedClasses.length,
      skippedCount: skippedClasses.length,
      imported: importedClasses,
      skipped: skippedClasses,
    })
  } catch (error) {
    console.error("Error importing classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
