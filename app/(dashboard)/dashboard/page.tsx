import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard/DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const userRole = session?.user?.role ?? "STAFF"
  const userBranchId = session?.user?.branchId

  const [ordersToday, pendingSettlements, lowStockItems, recentOrders, openTickets, pendingCounts, pendingShiftClosings, categories, branches] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, status: "COMPLETED" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.settlement.count({ where: { status: "PENDING" } }),
    prisma.ingredient.findMany({
      select: { id: true, name: true, currentQty: true, minQty: true, unit: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: today }, status: "COMPLETED" },
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
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
    prisma.branch.findMany({
      where: {
        isActive: true,
        ...(userRole === "STAFF" || userRole === "VIEWER" ? { id: userBranchId ?? undefined } : {}),
      },
      select: { id: true, name: true },
    }),
  ])

  const lowStockCount = lowStockItems.filter(
    (i) => Number(i.currentQty) <= Number(i.minQty)
  ).length
  const lowStockList = lowStockItems
    .filter((i) => Number(i.currentQty) <= Number(i.minQty))
    .slice(0, 5)

  const salesTotal = Number(ordersToday._sum.total ?? 0)
  const ordersCount = ordersToday._count._all ?? 0

  const initialStats = {
    salesTotal,
    ordersCount,
    pendingSettlements,
    lowStockCount,
    openTickets,
    pendingCounts,
    pendingShiftClosings,
  }

  return (
    <DashboardClient
      initialDate={today.toISOString()}
      initialStats={initialStats}
      initialOrders={recentOrders}
      initialLowStock={lowStockList}
      categories={categories}
      branches={branches}
    />
  )
}
