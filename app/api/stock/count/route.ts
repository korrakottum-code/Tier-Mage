import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCountTier } from "@/lib/stock-calc"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const counts = await prisma.stockCount.findMany({
    where: branchId ? { branchId } : undefined,
    include: {
      ingredient: { select: { id: true, name: true, unit: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  return NextResponse.json(counts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER", "STAFF"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()

  const ingredient = await prisma.ingredient.findUnique({ where: { id: body.ingredientId } })
  if (!ingredient) return NextResponse.json({ error: "Ingredient not found" }, { status: 404 })

  const systemQty = Number(ingredient.currentQty)
  const countedQty = Number(body.countedQty)
  const difference = countedQty - systemQty
  const diffPercent = systemQty === 0 ? 0 : Math.abs((difference / systemQty) * 100)
  const tier = getCountTier(diffPercent, Number(ingredient.autoThreshold), Number(ingredient.warnThreshold))

  const employee = await prisma.employee.findFirst({
    where: { user: { id: session.user?.id } },
  })
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 })

  // AUTO = auto-approve, REASON = approved immediately (staff provides reason), APPROVAL = needs manager
  const isImmediate = tier === "AUTO" || tier === "REASON"
  const newStatus = tier === "AUTO" ? "AUTO_APPROVED" : tier === "REASON" ? "APPROVED" : "PENDING"

  const stockCount = await prisma.stockCount.create({
    data: {
      branchId: body.branchId,
      ingredientId: body.ingredientId,
      countedById: employee.id,
      systemQty,
      countedQty,
      difference,
      diffPercent,
      tier,
      reason: body.reason ?? null,
      reasonNote: body.reasonNote ?? null,
      status: newStatus,
      resolvedAt: isImmediate ? new Date() : null,
    },
    include: {
      ingredient: { select: { id: true, name: true, unit: true } },
      branch: { select: { id: true, name: true } },
    },
  })

  if (isImmediate) {
    await prisma.$transaction([
      prisma.ingredient.update({
        where: { id: body.ingredientId },
        data: { currentQty: countedQty },
      }),
      prisma.stockAdjustment.create({
        data: {
          countId: stockCount.id,
          ingredientId: body.ingredientId,
          adjustedById: employee.id,
          oldQty: systemQty,
          newQty: countedQty,
          difference,
        },
      }),
    ])
  }

  return NextResponse.json(stockCount)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const { id, action, approvedNote } = body

  const count = await prisma.stockCount.findUnique({ where: { id } })
  if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const employee = await prisma.employee.findFirst({
    where: { user: { id: session.user?.id } },
  })
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 })

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED"

  const updated = await prisma.stockCount.update({
    where: { id },
    data: {
      status: newStatus,
      approvedById: session.user?.id,
      approvedNote: approvedNote ?? null,
      resolvedAt: new Date(),
    },
    include: { ingredient: { select: { id: true, name: true, unit: true } } },
  })

  if (newStatus === "APPROVED") {
    await prisma.$transaction([
      prisma.ingredient.update({
        where: { id: count.ingredientId },
        data: { currentQty: count.countedQty },
      }),
      prisma.stockAdjustment.create({
        data: {
          countId: count.id,
          ingredientId: count.ingredientId,
          adjustedById: employee.id,
          oldQty: count.systemQty,
          newQty: count.countedQty,
          difference: count.difference,
        },
      }),
    ])
  }

  return NextResponse.json(updated)
}
