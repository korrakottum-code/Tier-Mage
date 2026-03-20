import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const days = parseInt(searchParams.get("days") ?? "7", 10)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  const orders = await prisma.order.findMany({
    where: {
      ...(branchId && branchId !== "ALL" ? { branchId } : {}),
      status: "COMPLETED",
      createdAt: { gte: startDate },
    },
    include: {
      items: { select: { menuItemId: true, quantity: true, lineTotal: true, menuItem: { select: { name: true } } } },
      payment: { select: { channelId: true, channel: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  })

  // KPI
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0)
  const totalOrders = orders.length
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Revenue by day
  const revenueByDay: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    revenueByDay[key] = 0
  }
  for (const order of orders) {
    const key = new Date(order.createdAt).toISOString().slice(0, 10)
    if (key in revenueByDay) revenueByDay[key] += Number(order.total)
  }

  // Top menu items
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const order of orders) {
    for (const item of order.items) {
      if (!itemMap[item.menuItemId]) {
        itemMap[item.menuItemId] = { name: item.menuItem.name, qty: 0, revenue: 0 }
      }
      itemMap[item.menuItemId].qty += item.quantity
      itemMap[item.menuItemId].revenue += Number(item.lineTotal)
    }
  }
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5)

  // Revenue by channel
  const channelMap: Record<string, { name: string; amount: number }> = {}
  for (const order of orders) {
    if (!order.payment) continue
    const key = order.payment.channelId ?? "unknown"
    if (!channelMap[key]) channelMap[key] = { name: order.payment.channel?.name ?? key, amount: 0 }
    channelMap[key].amount += Number(order.total)
  }
  const channels = Object.values(channelMap).sort((a, b) => b.amount - a.amount)

  return NextResponse.json({
    totalRevenue,
    totalOrders,
    avgOrder,
    revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
    topItems,
    channels,
  })
}
