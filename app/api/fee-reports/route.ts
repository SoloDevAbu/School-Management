import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const batch = searchParams.get("batch")
    const className = searchParams.get("class")
    const reportType = searchParams.get("type") || "summary"

    // Build where clause for filtering
    const classWhere: any = {}
    if (batch && batch !== "all") {
      classWhere.batch = { name: batch }
    }
    if (className && className !== "all") {
      classWhere.name = className
    }

    // Get students with their fee payments and class information
    const students = await prisma.student.findMany({
      where: Object.keys(classWhere).length > 0 ? { class: classWhere } : {},
      include: {
        class: {
          include: {
            batch: true,
          },
        },
        feePayments: {
          include: {
            feeStructure: true,
          },
        },
      },
    })

    // Get fee structures for the filtered classes
    const feeStructures = await prisma.feeStructure.findMany({
      where: Object.keys(classWhere).length > 0 ? { class: classWhere } : {},
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
        const key = `${student.class.name}-${student.class.batch.name}`
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

      const classTotalDue = classFeeStructures.reduce((sum, fs) => sum + fs.amount, 0) * classStudents.length
      const classTotalCollected = classStudents.reduce((sum, student) => {
        return (
          sum +
          student.feePayments
            .filter((payment) => payment.status === "PAID")
            .reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
        )
      }, 0)

      totalDue += classTotalDue
      totalCollected += classTotalCollected

      classWiseData.push({
        className,
        batchName,
        totalStudents: classStudents.length,
        totalDue: classTotalDue,
        totalCollected: classTotalCollected,
        outstanding: classTotalDue - classTotalCollected,
        collectionPercentage: classTotalDue > 0 ? (classTotalCollected / classTotalDue) * 100 : 0,
      })
    })

    // Get recent payments
    const recentPayments = await prisma.feePayment.findMany({
      take: 10,
      orderBy: {
        paymentDate: "desc",
      },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
    })

    const reportData = {
      summary: {
        totalStudents: students.length,
        totalDue,
        totalCollected,
        outstandingAmount: totalDue - totalCollected,
        collectionPercentage: totalDue > 0 ? (totalCollected / totalDue) * 100 : 0,
      },
      classWiseData,
      recentPayments: recentPayments.map((payment) => ({
        id: payment.id,
        studentName: `${payment.student.firstName} ${payment.student.lastName}`,
        className: payment.student.class.name,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
      })),
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating fee report:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
