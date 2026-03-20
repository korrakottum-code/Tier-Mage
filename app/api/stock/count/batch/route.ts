import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCountTier } from "@/lib/stock-calc"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER", "STAFF"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  const body = await req.json()
  const { branchId, counts } = body // counts is array of { ingredientId, countedQty, reason, reasonNote }

  if (!branchId || !Array.isArray(counts)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const employee = await prisma.employee.findFirst({
    where: { user: { id: session.user?.id } },
  })
  
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 })

  const results = []

  for (const item of counts) {
    if (item.countedQty === undefined || item.countedQty === null) continue;

    const ingredient = await prisma.ingredient.findUnique({ where: { id: item.ingredientId } })
    if (!ingredient) continue

    const systemQty = Number(ingredient.currentQty)
    const countedQty = Number(item.countedQty)
    const difference = countedQty - systemQty
    const diffPercent = systemQty === 0 ? 0 : Math.abs((difference / systemQty) * 100)
    const tier = getCountTier(diffPercent, Number(ingredient.autoThreshold), Number(ingredient.warnThreshold))

    const isImmediate = tier === "AUTO" || tier === "REASON"
    const newStatus = tier === "AUTO" ? "AUTO_APPROVED" : tier === "REASON" ? "APPROVED" : "PENDING"

    const stockCount = await prisma.stockCount.create({
      data: {
        branchId,
        ingredientId: item.ingredientId,
        countedById: employee.id,
        systemQty,
        countedQty,
        difference,
        diffPercent,
        tier,
        reason: item.reason ?? null,
        reasonNote: item.reasonNote ?? null,
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
          where: { id: item.ingredientId },
          data: { currentQty: countedQty },
        }),
        prisma.stockAdjustment.create({
          data: {
            countId: stockCount.id,
            ingredientId: item.ingredientId,
            adjustedById: employee.id,
            oldQty: systemQty,
            newQty: countedQty,
            difference,
          },
        }),
      ])
    }
    results.push(stockCount)
  }

  return NextResponse.json(results)
}