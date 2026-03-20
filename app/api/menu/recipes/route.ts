import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const recipe = await prisma.recipe.create({
    data: {
      menuItemId: body.menuItemId,
      ingredientId: body.ingredientId,
      quantity: body.quantity,
      unit: body.unit,
    },
    include: { ingredient: { select: { id: true, name: true, unit: true } } },
  })
  return NextResponse.json(recipe)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.recipe.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
