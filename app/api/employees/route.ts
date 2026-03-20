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
  const employees = await prisma.employee.findMany({
    where: { ...(branchId ? { branchId } : {}), isActive: true },
    include: { branch: { select: { id: true, name: true } }, user: { select: { id: true, email: true, role: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const employee = await prisma.employee.create({
    data: {
      name: body.name,
      branchId: body.branchId,
      position: body.position,
      phone: body.phone ?? null,
      hourlyRate: body.hourlyRate ?? 0,
      startDate: new Date(body.startDate),
      isActive: true,
    },
    include: { branch: { select: { id: true, name: true } }, user: { select: { id: true, email: true, role: true } } },
  })
  return NextResponse.json(employee)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const employee = await prisma.employee.update({
    where: { id: body.id },
    data: {
      name: body.name,
      branchId: body.branchId,
      position: body.position,
      phone: body.phone ?? null,
      hourlyRate: body.hourlyRate,
      startDate: new Date(body.startDate),
    },
    include: { branch: { select: { id: true, name: true } }, user: { select: { id: true, email: true, role: true } } },
  })
  return NextResponse.json(employee)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.employee.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
