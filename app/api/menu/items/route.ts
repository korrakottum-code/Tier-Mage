import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createMenuItemSchema, updateMenuItemSchema } from "@/lib/validations"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const items = await prisma.menuItem.findMany({
    where: { isArchived: false },
    include: {
      category: { select: { id: true, name: true } },
      recipes: { include: { ingredient: { select: { id: true, name: true, unit: true } } } },
      menuOptions: true,
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
  const rawBody = await req.json()
  const parsed = createMenuItemSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const body = parsed.data
  const item = await prisma.menuItem.create({
    data: {
      name: body.name,
      categoryId: body.categoryId,
      price: body.price,
      isAvailable: body.isAvailable,
      imageUrl: body.imageUrl ?? null,
    },
    include: { category: { select: { id: true, name: true } }, recipes: true, menuOptions: true },
  })
  return NextResponse.json(item)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const rawBody = await req.json()
  const parsed = updateMenuItemSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const body = parsed.data
  const item = await prisma.menuItem.update({
    where: { id: body.id },
    data: {
      name: body.name,
      categoryId: body.categoryId,
      price: body.price,
      isAvailable: body.isAvailable,
      imageUrl: body.imageUrl ?? null,
    },
    include: { category: { select: { id: true, name: true } }, recipes: true, menuOptions: true },
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
  try {
    // Delete related records first
    await prisma.recipe.deleteMany({ where: { menuItemId: id } })
    await prisma.menuOption.deleteMany({ where: { menuItemId: id } })
    await prisma.branchMenuOverride.deleteMany({ where: { menuItemId: id } })
    await prisma.menuItem.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    // If still fails (e.g. has order items), soft-delete instead
    try {
      await prisma.menuItem.update({ where: { id }, data: { isArchived: true } })
      return NextResponse.json({ ok: true, softDeleted: true, message: "เมนูนี้มีออเดอร์อ้างอิง จึงทำการซ่อนแทนการลบ" })
    } catch {
      return NextResponse.json({ error: "ไม่สามารถลบแบบซ่อนเมนูได้" }, { status: 400 })
    }
  }
}
