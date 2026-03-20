import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const ingredients = await prisma.ingredient.findMany({
    where: branchId ? { branchId } : undefined,
    include: { branch: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(ingredients)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const ingredient = await prisma.ingredient.create({
    data: {
      name: body.name,
      branchId: body.branchId,
      unit: body.unit,
      costPerUnit: body.costPerUnit ?? 0,
      currentQty: body.currentQty ?? 0,
      minQty: body.minQty ?? 0,
      checkFrequency: body.checkFrequency ?? "Daily",
      autoThreshold: body.autoThreshold ?? 5,
      warnThreshold: body.warnThreshold ?? 20,
    },
    include: { branch: { select: { id: true, name: true } } },
  })
  return NextResponse.json(ingredient)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const ingredient = await prisma.ingredient.update({
    where: { id: body.id },
    data: {
      name: body.name,
      branchId: body.branchId,
      unit: body.unit,
      costPerUnit: body.costPerUnit,
      minQty: body.minQty,
      checkFrequency: body.checkFrequency,
      autoThreshold: body.autoThreshold ?? undefined,
      warnThreshold: body.warnThreshold ?? undefined,
    },
    include: { branch: { select: { id: true, name: true } } },
  })
  return NextResponse.json(ingredient)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.ingredient.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
