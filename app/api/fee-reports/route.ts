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
    const classId = searchParams.get("classId")
    const search = searchParams.get("search")
    const reportType = searchParams.get("type") || "summary"

    // Build where clause for filtering
    const whereClause: any = {}

    // Filter by search term
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { admissionNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter by class or batch
    if (classId) {
      whereClause.studentClasses = {
        some: {
          classId,
          isActive: true,
        },
      }
    } else if (batchId) {
      whereClause.studentClasses = {
        some: {
          class: {
            batchId,
          },
          isActive: true,
        },
      }
    }

    // Get students with their fee payments and class information
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        studentClasses: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
                isActive: true,
                batch: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc",
          }
        },
        feeCollections: {
          include: {
            feeStructures: {
              select: {
                feeCollectionId: true,
                feeStructureId: true
              }
            }
          }
        }
      }
      
    })

    // Get fee structures for the filtered classes
    const feeStructures = await prisma.feeStructure.findMany({
      where: whereClause,
      include: {
        class: {
          include: {
            batch: true,
          },
        },
      },
    })

    // Calculate summary data
    let totalDue = 0
    let totalCollected = 0
    const classWiseData: any[] = []

    // Group students by class
    const studentsByClass = students.reduce(
      (acc, student) => {
        const activeClass = student.studentClasses.find(sc => sc.isActive)
        if (!activeClass) return acc
        
        const key = `${activeClass.class.name}-${activeClass.class.batch.name}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(student)
        return acc
      },
      {} as Record<string, typeof students>,
    )

    // Calculate class-wise data
    Object.entries(studentsByClass).forEach(([classKey, classStudents]) => {
      const [className, batchName] = classKey.split("-")

      // Get applicable fee structures for this class
      const classFeeStructures = feeStructures.filter(
        (fs) => fs.class.name === className && fs.class.batch.name === batchName,
      )

      const classTotalDue = classFeeStructures.reduce((sum, fs) => sum + Number(fs.amount), 0) * classStudents.length
      const classTotalCollected = classStudents.reduce((sum, student) => {
        return (
          sum +
          student.feeCollections
            .filter((payment) => payment.status === "PAID")
            .reduce((paymentSum, payment) => paymentSum + Number(payment.amountPaid), 0)
        )
      }, 0)

      // Calculate outstanding amount - if no fees are due but payments were made, outstanding should be 0
      const outstanding = Math.max(0, classTotalDue - classTotalCollected)

      totalDue += classTotalDue
      totalCollected += classTotalCollected

      classWiseData.push({
        className,
        batchName,
        totalStudents: classStudents.length,
        totalDue: classTotalDue,
        totalCollected: classTotalCollected,
        outstanding: outstanding,
        collectionPercentage: classTotalDue > 0 ? (classTotalCollected / classTotalDue) * 100 : 0,
      })
    })

    // Get recent payments
    const recentPayments = await prisma.feeCollection.findMany({
      take: 10,
      orderBy: {
        paymentDate: "desc",
      },
      include: {
        student: {
          include: {
            studentClasses: {
              include: {
                class: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
        },
      },
    })

    const reportData = {
      summary: {
        totalStudents: students.length,
        totalDue,
        totalCollected,
        outstandingAmount: Math.max(0, totalDue - totalCollected),
        collectionPercentage: totalDue > 0 ? (totalCollected / totalDue) * 100 : 0,
      },
      classWiseData,
      recentPayments: recentPayments.map((payment) => {
        const activeClass = payment.student.studentClasses.find(sc => sc.isActive)
        return {
          id: payment.id,
          studentName: `${payment.student.firstName} ${payment.student.lastName}`,
          className: activeClass?.class?.name || 'No Class',
          amount: payment.amountPaid,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
        }
      }),
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating fee report:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
