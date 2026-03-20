import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const date = searchParams.get("date") // YYYY-MM-DD

  let startDate: Date, endDate: Date
  if (date) {
    startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)
  } else {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
  }

  const closings = await prisma.shiftClosing.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      shiftDate: { gte: startDate, lte: endDate },
    },
    include: {
      employee: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      slips: { select: { id: true, fileName: true, amount: true, uploadedAt: true } },
    },
    orderBy: { shiftDate: "desc" },
  })

  return NextResponse.json(closings)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const employee = await prisma.employee.findFirst({
    where: { user: { id: session.user?.id } },
  })

  const startingCash = Number(body.startingCash ?? 0)
  const cashExpected = Number(body.cashExpected ?? 0)
  const cashActual = Number(body.cashActual ?? 0)
  const transferExpected = Number(body.transferExpected ?? 0)
  const transferActual = Number(body.transferActual ?? 0)
  
  // หักเงินทอนตั้งต้นออกจากเงินสดที่นับได้จริง เพื่อหาเงินสดที่ขายได้จริง
  const netCashActual = cashActual - startingCash
  const cashDiff = netCashActual - cashExpected
  const transferDiff = transferActual - transferExpected

  const threshold = 50
  const isAutoApprove =
    Math.abs(cashDiff) <= threshold && Math.abs(transferDiff) <= threshold

  const closing = await prisma.shiftClosing.create({
    data: {
      branchId: body.branchId,
      employeeId: employee?.id ?? body.employeeId,
      shiftDate: new Date(body.shiftDate),
      shift: body.shift,
      startingCash,
      cashExpected,
      cashActual,
      cashDifference: cashDiff,
      transferExpected,
      transferActual,
      transferDifference: transferDiff,
      status: isAutoApprove ? "AUTO_APPROVED" : "PENDING",
      reviewedBy: isAutoApprove ? "ระบบ" : null,
    },
    include: {
      employee: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      slips: true,
    },
  })

  return NextResponse.json(closing)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { id, action, reviewNote } = body

  const statusMap: Record<string, string> = {
    approve: "APPROVED",
    reject: "REJECTED",
  }
  const newStatus = statusMap[action]
  if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  const closing = await prisma.shiftClosing.update({
    where: { id },
    data: {
      status: newStatus as never,
      reviewedBy: session.user?.name ?? session.user?.email ?? null,
      reviewNote: reviewNote ?? null,
      reviewedAt: new Date(),
    },
    include: {
      employee: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      slips: true,
    },
  })

  return NextResponse.json(closing)
}
