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
  const status = searchParams.get("status")

  const settlements = await prisma.settlement.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      channel: { select: { id: true, name: true, gpPercent: true, feePercent: true } },
      branch: { select: { id: true, name: true } },
      fees: true,
    },
    orderBy: { saleDate: "desc" },
    take: 100,
  })

  return NextResponse.json(settlements)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { id, actualAmount, note } = body

  const settlement = await prisma.settlement.findUnique({ where: { id } })
  if (!settlement) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const actual = Number(actualAmount)
  const expected = Number(settlement.expectedAmount)
  const diff = Math.abs(actual - expected)
  const threshold = expected * 0.01
  const newStatus = diff <= threshold ? "MATCHED" : "MISMATCHED"

  const updated = await prisma.settlement.update({
    where: { id },
    data: {
      actualAmount: actual,
      status: newStatus,
      settledAt: new Date(),
      note: note ?? null,
    },
    include: {
      channel: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      fees: true,
    },
  })

  return NextResponse.json(updated)
}
