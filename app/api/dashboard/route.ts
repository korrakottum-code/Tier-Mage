import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date") || new Date().toISOString().slice(0, 10)
  const categoryId = searchParams.get("categoryId")
  const branchId = searchParams.get("branchId")

  const selectedDate = new Date(dateStr)
  selectedDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(selectedDate)
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
    prisma.ingredient.findMany({
      select: { id: true, name: true, currentQty: true, minQty: true, unit: true },
    }),
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

  const lowStockCount = lowStockItems.filter(
    (i) => Number(i.currentQty) <= Number(i.minQty)
  ).length
  const lowStockList = lowStockItems
    .filter((i) => Number(i.currentQty) <= Number(i.minQty))
    .slice(0, 5)

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
