import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const month = searchParams.get("month") // YYYY-MM

  let start: Date, end: Date
  if (month) {
    start = new Date(`${month}-01`)
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  } else {
    start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  }

  const where: Record<string, unknown> = {
    workDate: { gte: start, lt: end },
  }
  if (branchId) {
    where.employee = { branchId }
  }

  const records = await prisma.attendance.findMany({
    where,
    include: { employee: { select: { id: true, name: true, position: true, branchId: true } } },
    orderBy: [{ workDate: "desc" }],
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { employeeId, action } = body

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (action === "clockIn") {
    const existing = await prisma.attendance.findFirst({
      where: { employeeId, workDate: { gte: today, lt: tomorrow } },
    })
    if (existing) {
      return NextResponse.json({ error: "Already clocked in today" }, { status: 409 })
    }

    const now = new Date()
    const schedule = await prisma.schedule.findFirst({
      where: { employeeId, workDate: { gte: today, lt: tomorrow } },
    })

    let status: "PRESENT" | "LATE" = "PRESENT"
    if (schedule) {
      const shiftStart: Record<string, number> = { MORNING: 8, AFTERNOON: 14, EVENING: 20 }
      const expectedHour = shiftStart[schedule.shift] ?? 8
      if (now.getHours() > expectedHour || (now.getHours() === expectedHour && now.getMinutes() > 15)) {
        status = "LATE"
      }
    }

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        workDate: today,
        clockIn: now,
        status,
      },
      include: { employee: { select: { id: true, name: true, position: true } } },
    })
    return NextResponse.json(record)
  }

  if (action === "clockOut") {
    const record = await prisma.attendance.findFirst({
      where: { employeeId, workDate: { gte: today, lt: tomorrow }, clockOut: null },
    })
    if (!record) {
      return NextResponse.json({ error: "No active clock-in found" }, { status: 404 })
    }

    const now = new Date()
    const clockIn = record.clockIn ? new Date(record.clockIn) : now
    const hoursWorked = Math.max(0, (now.getTime() - clockIn.getTime()) / 3600000)
    const overtimeHours = Math.max(0, hoursWorked - 8)

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        clockOut: now,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
      },
      include: { employee: { select: { id: true, name: true, position: true } } },
    })
    return NextResponse.json(updated)
  }

  // Manual create (ADMIN/MANAGER)
  if (!["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const record = await prisma.attendance.create({
    data: {
      employeeId: body.employeeId,
      workDate: new Date(body.workDate),
      clockIn: body.clockIn ? new Date(body.clockIn) : null,
      clockOut: body.clockOut ? new Date(body.clockOut) : null,
      hoursWorked: body.hoursWorked ?? null,
      overtimeHours: body.overtimeHours ?? 0,
      status: body.status ?? "PRESENT",
    },
    include: { employee: { select: { id: true, name: true, position: true } } },
  })
  return NextResponse.json(record)
}
