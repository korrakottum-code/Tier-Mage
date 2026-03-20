import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  if (!branchId) return NextResponse.json({ error: "branchId required" }, { status: 400 })

  const overrides = await prisma.branchMenuOverride.findMany({
    where: { branchId },
    include: { menuItem: { select: { id: true, name: true, price: true, isAvailable: true, category: { select: { name: true } } } } },
    orderBy: { menuItem: { name: "asc" } },
  })

  return NextResponse.json(overrides)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { branchId, menuItemId, price, isAvailable } = body

  const override = await prisma.branchMenuOverride.upsert({
    where: { branchId_menuItemId: { branchId, menuItemId } },
    create: {
      branchId,
      menuItemId,
      price: price != null ? Number(price) : null,
      isAvailable: isAvailable ?? true,
    },
    update: {
      price: price != null ? Number(price) : null,
      isAvailable: isAvailable ?? true,
    },
    include: { menuItem: { select: { id: true, name: true, price: true, category: { select: { name: true } } } } },
  })

  return NextResponse.json(override)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await prisma.branchMenuOverride.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
