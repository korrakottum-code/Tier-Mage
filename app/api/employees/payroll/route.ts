import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
    periodStart: { gte: start },
    periodEnd: { lt: end },
  }
  if (branchId) {
    where.employee = { branchId }
  }

  const payrolls = await prisma.payroll.findMany({
    where,
    include: { employee: { select: { id: true, name: true, position: true, branchId: true, hourlyRate: true } } },
    orderBy: { periodStart: "desc" },
  })

  return NextResponse.json(payrolls)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { branchId, month } = body // month = "YYYY-MM"

  if (!branchId || !month) {
    return NextResponse.json({ error: "branchId and month required" }, { status: 400 })
  }

  const periodStart = new Date(`${month}-01`)
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0)

  const employees = await prisma.employee.findMany({
    where: { branchId, isActive: true },
  })

  const results = []
  for (const emp of employees) {
    const existing = await prisma.payroll.findFirst({
      where: { employeeId: emp.id, periodStart },
    })
    if (existing) continue

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: emp.id,
        workDate: { gte: periodStart, lte: periodEnd },
      },
    })

    const totalHours = attendances.reduce((s, a) => s + Number(a.hoursWorked ?? 0), 0)
    const totalOT = attendances.reduce((s, a) => s + Number(a.overtimeHours ?? 0), 0)
    const rate = Number(emp.hourlyRate)
    const baseSalary = Math.round(totalHours * rate * 100) / 100
    const overtimePay = Math.round(totalOT * rate * 1.5 * 100) / 100
    const netPay = baseSalary + overtimePay

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: emp.id,
        periodStart,
        periodEnd,
        baseSalary,
        overtimePay,
        bonus: 0,
        deductions: 0,
        netPay,
      },
      include: { employee: { select: { id: true, name: true, position: true } } },
    })
    results.push(payroll)
  }

  return NextResponse.json(results)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { id, bonus, deductions, paidAt } = body

  const payroll = await prisma.payroll.findUnique({ where: { id } })
  if (!payroll) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const newBonus = bonus !== undefined ? Number(bonus) : Number(payroll.bonus)
  const newDeductions = deductions !== undefined ? Number(deductions) : Number(payroll.deductions)
  const netPay = Number(payroll.baseSalary) + Number(payroll.overtimePay) + newBonus - newDeductions

  const updated = await prisma.payroll.update({
    where: { id },
    data: {
      bonus: newBonus,
      deductions: newDeductions,
      netPay,
      paidAt: paidAt ? new Date(paidAt) : payroll.paidAt,
    },
    include: { employee: { select: { id: true, name: true, position: true } } },
  })

  return NextResponse.json(updated)
}
