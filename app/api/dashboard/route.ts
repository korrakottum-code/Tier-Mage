import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionWithBranchCheck } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const result = await getSessionWithBranchCheck(searchParams.get("branchId"))
  if ("error" in result) return result.error

  const dateStr = searchParams.get("date") || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" })
  const categoryId = searchParams.get("categoryId")
  const branchId = result.effectiveBranchId

  // Use Asia/Bangkok timezone (+7) for correct Thai business day
  const selectedDate = new Date(dateStr + "T00:00:00+07:00")
  const nextDay = new Date(dateStr + "T00:00:00+07:00")
  nextDay.setDate(nextDay.getDate() + 1)

  // Build where clause for orders
  const orderWhere: any = {
    createdAt: { gte: selectedDate, lt: nextDay },
    status: "COMPLETED"
  }

  // Add branch filter if specified
  if (branchId) {
    orderWhere.branchId = branchId
  }

  // Add category filter if specified
  if (categoryId) {
    orderWhere.items = {
      some: {
        menuItem: {
          categoryId
        }
      }
    }
  }

  const [ordersData, pendingSettlements, lowStockItems, recentOrders, openTickets, pendingCounts, pendingShiftClosings] = await Promise.all([
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.settlement.count({ where: { status: "PENDING" } }),
    branchId
      ? prisma.$queryRaw<{ id: string; name: string; currentQty: number; minQty: number; unit: string }[]>`
          SELECT id, name, "currentQty", "minQty", unit FROM "Ingredient"
          WHERE "branchId" = ${branchId} AND "currentQty" <= "minQty"`
      : prisma.$queryRaw<{ id: string; name: string; currentQty: number; minQty: number; unit: string }[]>`
          SELECT id, name, "currentQty", "minQty", unit FROM "Ingredient"
          WHERE "currentQty" <= "minQty"`,
    prisma.order.findMany({
      where: orderWhere,
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        payment: { include: { channel: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.stockCount.count({ where: { status: "PENDING" } }),
    prisma.shiftClosing.count({ where: { status: "PENDING" } }),
  ])

  // lowStockItems already filtered at DB level (currentQty <= minQty)
  const lowStockCount = lowStockItems.length
  const lowStockList = lowStockItems.slice(0, 5)

  const salesTotal = Number(ordersData._sum.total ?? 0)
  const ordersCount = ordersData._count._all ?? 0

  return NextResponse.json({
    stats: {
      salesTotal,
      ordersCount,
      pendingSettlements,
      lowStockCount,
      openTickets,
      pendingCounts,
      pendingShiftClosings,
    },
    orders: recentOrders,
    lowStock: lowStockList,
  })
}
