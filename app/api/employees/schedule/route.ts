import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const weekStart = searchParams.get("weekStart") // YYYY-MM-DD

  if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 })

  const start = new Date(weekStart)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  const where: Record<string, unknown> = {
    workDate: { gte: start, lt: end },
  }
  if (branchId) {
    where.employee = { branchId }
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: { employee: { select: { id: true, name: true, position: true, branchId: true } } },
    orderBy: [{ workDate: "asc" }, { shift: "asc" }],
  })

  return NextResponse.json(schedules)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { employeeId, workDate, shift, isLeave, leaveType } = body

  const existing = await prisma.schedule.findFirst({
    where: { employeeId, workDate: new Date(workDate), shift },
  })
  if (existing) {
    return NextResponse.json({ error: "Schedule already exists for this employee/date/shift" }, { status: 409 })
  }

  const schedule = await prisma.schedule.create({
    data: {
      employeeId,
      workDate: new Date(workDate),
      shift,
      isLeave: isLeave ?? false,
      leaveType: leaveType ?? null,
    },
    include: { employee: { select: { id: true, name: true, position: true } } },
  })

  return NextResponse.json(schedule)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await prisma.schedule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
