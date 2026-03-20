import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const date = searchParams.get("date")
  if (!branchId || !date) {
    return NextResponse.json({ error: "branchId and date required" }, { status: 400 })
  }

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const orders = await prisma.order.findMany({
    where: {
      branchId,
      status: "COMPLETED",
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      payment: { include: { channel: true } },
    },
  })

  let cashExpected = 0
  let transferExpected = 0

  for (const order of orders) {
    if (!order.payment) continue
    const channel = order.payment.channel
    const amount = Number(order.total)
    if (channel.type === "INSTANT") {
      // Cash or transfer — check channel name heuristic
      const name = channel.name.toLowerCase()
      if (name.includes("เงินสด") || name.includes("cash")) {
        cashExpected += amount
      } else {
        transferExpected += amount
      }
    }
    // DEFERRED channels are handled via Settlement, not shift closing
  }

  return NextResponse.json({ cashExpected, transferExpected })
}
