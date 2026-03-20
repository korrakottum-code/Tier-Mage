import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSessionWithBranchCheck } from "@/lib/api-utils"
import { createOrderSchema, voidOrderSchema } from "@/lib/validations"

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
  const rawBody = await req.json()
  const parsed = createOrderSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const body = parsed.data

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

  // === Atomic transaction: order + stock deduction + settlement ===
  const order = await prisma.$transaction(async (tx) => {
    // 1. Create order with items + payment
    const newOrder = await tx.order.create({
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: body.items.map((item) => {
            const optPrice = (item.options || []).reduce((s, o) => s + (o.priceModifier || 0), 0)
            return {
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              options: (item.options as any) ?? null,
              lineTotal: (item.unitPrice + optPrice) * item.quantity,
            }
          }),
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

    // 2. Batch-fetch all recipes for ordered items (fixes N+1 query)
    const menuItemIds = [...new Set(body.items.map((i: { menuItemId: string }) => i.menuItemId))]
    const allRecipes = await tx.recipe.findMany({
      where: { menuItemId: { in: menuItemIds as string[] } },
    })

    // 3. Calculate total deductions per ingredient
    const deductions: Record<string, { qty: number; ingredientId: string }> = {}
    for (const item of body.items) {
      const itemRecipes = allRecipes.filter((r) => r.menuItemId === item.menuItemId)
      for (const recipe of itemRecipes) {
        const deductQty = Number(recipe.quantity) * item.quantity
        if (!deductions[recipe.ingredientId]) {
          deductions[recipe.ingredientId] = { qty: 0, ingredientId: recipe.ingredientId }
        }
        deductions[recipe.ingredientId].qty += deductQty
      }
    }

    // 4. Deduct stock + create movements in single pass
    const performer = session.user?.name ?? session.user?.email ?? null
    for (const { ingredientId, qty } of Object.values(deductions)) {
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentQty: { decrement: qty } },
      })
      await tx.stockMovement.create({
        data: {
          ingredientId,
          type: "SALE",
          quantity: qty,
          note: `Order ${newOrder.orderNumber}`,
          performer,
        },
      })
    }

    // 5. Update lastSoldAt
    await tx.menuItem.updateMany({
      where: { id: { in: menuItemIds as string[] } },
      data: { lastSoldAt: new Date() },
    })

    // 6. Auto-create Settlement
    const channel = await tx.paymentChannel.findUnique({ where: { id: body.channelId } })
    if (channel) {
      const gpDeduction = total * (Number(channel.gpPercent) / 100)
      const feeDeduction = total * (Number(channel.feePercent) / 100)
      const expectedAmount = total - gpDeduction - feeDeduction
      const isInstant = channel.type === "INSTANT"

      await tx.settlement.create({
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

    return newOrder
  })

  return NextResponse.json(order)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const rawBody = await req.json()
  const parsed = voidOrderSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const body = parsed.data

  const existing = await prisma.order.findUnique({
    where: { id: body.id },
    include: { items: true, payment: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // === Atomic transaction: void order + restore stock + void settlement ===
  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: body.id },
      data: { status: body.status },
      include: {
        items: { include: { menuItem: { select: { id: true, name: true } } } },
        payment: { include: { channel: { select: { id: true, name: true } } } },
      },
    })

    if (body.status === "VOIDED" && existing.status !== "VOIDED") {
      // Batch-fetch all recipes (fix N+1)
      const menuItemIds = existing.items.map((i) => i.menuItemId)
      const allRecipes = await tx.recipe.findMany({
        where: { menuItemId: { in: menuItemIds } },
      })

      // Calculate total restorations per ingredient
      const restorations: Record<string, number> = {}
      for (const item of existing.items) {
        const itemRecipes = allRecipes.filter((r) => r.menuItemId === item.menuItemId)
        for (const recipe of itemRecipes) {
          const qty = Number(recipe.quantity) * item.quantity
          restorations[recipe.ingredientId] = (restorations[recipe.ingredientId] || 0) + qty
        }
      }

      // Restore stock + create adjustment movements
      const performer = session.user?.name ?? session.user?.email ?? null
      for (const [ingredientId, qty] of Object.entries(restorations)) {
        await tx.ingredient.update({
          where: { id: ingredientId },
          data: { currentQty: { increment: qty } },
        })
        await tx.stockMovement.create({
          data: {
            ingredientId,
            type: "ADJUSTMENT",
            quantity: qty,
            note: `Void ${existing.orderNumber}`,
            performer,
          },
        })
      }

      // Mark related settlement as MISMATCHED
      if (existing.payment) {
        const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" })
        const todayStart = new Date(todayStr + "T00:00:00+07:00")
        const todayEnd = new Date(todayStr + "T23:59:59.999+07:00")
        await tx.settlement.updateMany({
          where: {
            branchId: existing.branchId,
            channelId: existing.payment.channelId,
            saleAmount: existing.total,
            saleDate: { gte: todayStart, lte: todayEnd },
            status: { in: ["PENDING", "SETTLED"] },
          },
          data: { status: "MISMATCHED", note: `Voided: ${existing.orderNumber}` },
        })
      }
    }

    return updated
  })

  return NextResponse.json(order)
}
