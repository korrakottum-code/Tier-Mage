import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const items = await prisma.menuItem.findMany({
    include: {
      category: { select: { id: true, name: true } },
      recipes: { include: { ingredient: { select: { id: true, name: true, unit: true } } } },
    },
    orderBy: [{ categoryId: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const item = await prisma.menuItem.create({
    data: {
      name: body.name,
      categoryId: body.categoryId,
      price: body.price,
      isAvailable: body.isAvailable ?? true,
      imageUrl: body.imageUrl ?? null,
    },
    include: { category: { select: { id: true, name: true } }, recipes: true },
  })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const item = await prisma.menuItem.update({
    where: { id: body.id },
    data: {
      name: body.name,
      categoryId: body.categoryId,
      price: body.price,
      isAvailable: body.isAvailable,
      imageUrl: body.imageUrl ?? null,
    },
    include: { category: { select: { id: true, name: true } }, recipes: true },
  })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.menuItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
