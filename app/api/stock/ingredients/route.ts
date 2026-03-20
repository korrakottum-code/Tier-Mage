import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSessionWithBranchCheck } from "@/lib/api-utils"
import { createIngredientSchema, updateIngredientSchema } from "@/lib/validations"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const result = await getSessionWithBranchCheck(searchParams.get("branchId"))
  if ("error" in result) return result.error
  const { effectiveBranchId } = result

  const ingredients = await prisma.ingredient.findMany({
    where: effectiveBranchId ? { branchId: effectiveBranchId } : undefined,
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
  const rawBody = await req.json()
  const parsed = createIngredientSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const body = parsed.data
  const ingredient = await prisma.ingredient.create({
    data: {
      name: body.name,
      branchId: body.branchId,
      unit: body.unit,
      costPerUnit: body.costPerUnit,
      currentQty: body.currentQty,
      minQty: body.minQty,
      checkFrequency: body.checkFrequency,
      autoThreshold: body.autoThreshold,
      warnThreshold: body.warnThreshold,
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
  const rawBody = await req.json()
  const parsed = updateIngredientSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const body = parsed.data
  const ingredient = await prisma.ingredient.update({
    where: { id: body.id },
    data: {
      name: body.name,
      unit: body.unit,
      costPerUnit: body.costPerUnit,
      minQty: body.minQty,
      checkFrequency: body.checkFrequency,
      autoThreshold: body.autoThreshold,
      warnThreshold: body.warnThreshold,
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
  try {
    // Delete related records first
    await prisma.recipe.deleteMany({ where: { ingredientId: id } })
    await prisma.stockMovement.deleteMany({ where: { ingredientId: id } })
    await prisma.stockCount.deleteMany({ where: { ingredientId: id } })
    await prisma.ingredient.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถลบวัตถุดิบนี้ได้ อาจมีข้อมูลอ้างอิงอยู่" }, { status: 400 })
  }
}
