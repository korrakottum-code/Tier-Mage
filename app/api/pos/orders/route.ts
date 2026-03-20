import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSessionWithBranchCheck } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const result = await getSessionWithBranchCheck(searchParams.get("branchId"))
  if ("error" in result) return result.error
  const branchId = result.effectiveBranchId
  const date = searchParams.get("date")

  // Use Asia/Bangkok timezone (+7) for correct Thai business day
  const dateStr = date || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" })
  const startOfDay = new Date(dateStr + "T00:00:00+07:00")
  const endOfDay = new Date(dateStr + "T23:59:59.999+07:00")

  const orders = await prisma.order.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      items: { include: { menuItem: { select: { id: true, name: true } } } },
      payment: { include: { channel: { select: { id: true, name: true } } } },
      employee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER", "STAFF"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()

  const employee = await prisma.employee.findFirst({
    where: { user: { id: session.user?.id } },
  })
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 })

  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" })
  const todayStart = new Date(todayStr + "T00:00:00+07:00")
  const orderCount = await prisma.order.count({
    where: { branchId: body.branchId, createdAt: { gte: todayStart } },
  })
  const datePart = todayStr.replace(/-/g, "").slice(2)
  const orderNumber = `ORD-${datePart}-${String(orderCount + 1).padStart(4, "0")}`

  const subtotal = body.items.reduce(
    (s: number, i: { unitPrice: number; quantity: number; options?: { name: string; choice: string; priceModifier: number }[] | null }) => {
      const optionsPrice = (i.options || []).reduce((sum: number, opt: { priceModifier: number }) => sum + (opt.priceModifier || 0), 0)
      return s + (i.unitPrice + optionsPrice) * i.quantity
    }, 0
  )
  const discount = body.discount ?? 0
  const total = subtotal - discount

  const order = await prisma.order.create({
    data: {
      branchId: body.branchId,
      employeeId: employee.id,
      orderNumber,
      subtotal,
      discount,
      total,
      status: "COMPLETED",
      source: body.source ?? "WALK_IN",
      items: {
        create: body.items.map((item: { menuItemId: string; quantity: number; unitPrice: number; options?: unknown }) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          options: item.options ?? null,
          lineTotal: (item.unitPrice + ((item.options as { priceModifier?: number }[] || []).reduce((s: number, o: { priceModifier?: number }) => s + (o.priceModifier || 0), 0))) * item.quantity,
        })),
      },
      payment: {
        create: {
          channelId: body.channelId,
          amount: body.amountPaid,
          change: body.amountPaid - total,
          reference: body.reference ?? null,
        },
      },
    },
    include: {
      items: { include: { menuItem: { select: { id: true, name: true } } } },
      payment: { include: { channel: { select: { id: true, name: true } } } },
    },
  })

  // deduct stock from recipes + record movements + update lastSoldAt
  try {
    const now = new Date()
    const menuItemIds = [...new Set(body.items.map((i: { menuItemId: string }) => i.menuItemId))]
    await prisma.menuItem.updateMany({
      where: { id: { in: menuItemIds as string[] } },
      data: { lastSoldAt: now },
    })
    for (const item of body.items) {
      const recipes = await prisma.recipe.findMany({ where: { menuItemId: item.menuItemId } })
      for (const recipe of recipes) {
        const deductQty = Number(recipe.quantity) * item.quantity
        await prisma.$transaction([
          prisma.ingredient.update({
            where: { id: recipe.ingredientId },
            data: { currentQty: { decrement: deductQty } },
          }),
          prisma.stockMovement.create({
            data: {
              ingredientId: recipe.ingredientId,
              type: "SALE",
              quantity: deductQty,
              note: `Order ${order.orderNumber}`,
              performer: session.user?.name ?? session.user?.email ?? null,
            },
          }),
        ])
      }
    }
  } catch (_) { /* stock deduct is best-effort */ }

  // auto-create Settlement for DEFERRED channels
  try {
    const channel = await prisma.paymentChannel.findUnique({ where: { id: body.channelId } })
    if (channel) {
      const gpDeduction = total * (Number(channel.gpPercent) / 100)
      const feeDeduction = total * (Number(channel.feePercent) / 100)
      const expectedAmount = total - gpDeduction - feeDeduction
      const isInstant = channel.type === "INSTANT"

      await prisma.settlement.create({
        data: {
          branchId: body.branchId,
          channelId: channel.id,
          saleDate: new Date(),
          saleAmount: total,
          expectedAmount: isInstant ? total : expectedAmount,
          actualAmount: isInstant ? total : null,
          status: isInstant ? "SETTLED" : "PENDING",
          settledAt: isInstant ? new Date() : null,
        },
      })
    }
  } catch (_) { /* settlement creation is best-effort */ }

  return NextResponse.json(order)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()

  const existing = await prisma.order.findUnique({
    where: { id: body.id },
    include: { items: true, payment: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const order = await prisma.order.update({
    where: { id: body.id },
    data: { status: body.status },
    include: {
      items: { include: { menuItem: { select: { id: true, name: true } } } },
      payment: { include: { channel: { select: { id: true, name: true } } } },
    },
  })

  // On VOIDED: restore stock + reverse movements + void settlement
  if (body.status === "VOIDED" && existing.status !== "VOIDED") {
    try {
      for (const item of existing.items) {
        const recipes = await prisma.recipe.findMany({ where: { menuItemId: item.menuItemId } })
        for (const recipe of recipes) {
          const restoreQty = Number(recipe.quantity) * item.quantity
          await prisma.$transaction([
            prisma.ingredient.update({
              where: { id: recipe.ingredientId },
              data: { currentQty: { increment: restoreQty } },
            }),
            prisma.stockMovement.create({
              data: {
                ingredientId: recipe.ingredientId,
                type: "ADJUSTMENT",
                quantity: restoreQty,
                note: `Void ${existing.orderNumber}`,
                performer: session.user?.name ?? session.user?.email ?? null,
              },
            }),
          ])
        }
      }
      // Mark related settlement as MISMATCHED
      if (existing.payment) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)
        await prisma.settlement.updateMany({
          where: {
            branchId: existing.branchId,
            channelId: existing.payment.channelId,
            saleAmount: existing.total,
            saleDate: { gte: today, lte: endOfDay },
            status: { in: ["PENDING", "SETTLED"] },
          },
          data: { status: "MISMATCHED", note: `Voided: ${existing.orderNumber}` },
        })
      }
    } catch (_) { /* void cleanup is best-effort */ }
  }

  return NextResponse.json(order)
}
