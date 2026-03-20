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

  let startDate: Date, endDate: Date
  if (month) {
    startDate = new Date(`${month}-01`)
    endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    startDate = new Date(); startDate.setDate(1); startDate.setHours(0,0,0,0)
    endDate = new Date(); endDate.setHours(23,59,59,999)
  }

  const txns = await prisma.transaction.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      date: { gte: startDate, lt: endDate },
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(txns)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const txn = await prisma.transaction.create({
    data: {
      branchId: body.branchId,
      type: body.type,
      categoryId: body.categoryId ?? null,
      amount: body.amount,
      description: body.description ?? null,
      date: new Date(body.date),
      referenceId: body.referenceId ?? null,
    },
    include: { category: { select: { id: true, name: true } } },
  })
  return NextResponse.json(txn)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.transaction.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
