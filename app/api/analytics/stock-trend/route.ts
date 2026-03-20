import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ingredientId = searchParams.get("ingredientId")
  const days = parseInt(searchParams.get("days") ?? "30")

  if (!ingredientId) {
    return NextResponse.json({ error: "ingredientId required" }, { status: 400 })
  }

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const movements = await prisma.stockMovement.findMany({
    where: {
      ingredientId,
      createdAt: { gte: since },
    },
    select: {
      type: true,
      quantity: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  // Group by day
  const dailyMap: Record<string, { date: string; purchase: number; sale: number; waste: number; adjustment: number; transfer: number }> = {}

  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    dailyMap[key] = { date: key, purchase: 0, sale: 0, waste: 0, adjustment: 0, transfer: 0 }
  }

  for (const m of movements) {
    const key = new Date(m.createdAt).toISOString().slice(0, 10)
    if (!dailyMap[key]) continue
    const qty = Number(m.quantity)
    switch (m.type) {
      case "PURCHASE": dailyMap[key].purchase += qty; break
      case "SALE": dailyMap[key].sale += qty; break
      case "WASTE": dailyMap[key].waste += qty; break
      case "ADJUSTMENT": dailyMap[key].adjustment += qty; break
      case "TRANSFER": dailyMap[key].transfer += qty; break
    }
  }

  const ingredient = await prisma.ingredient.findUnique({
    where: { id: ingredientId },
    select: { id: true, name: true, unit: true, currentQty: true },
  })

  return NextResponse.json({
    ingredient,
    trend: Object.values(dailyMap),
  })
}
