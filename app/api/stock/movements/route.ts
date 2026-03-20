import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const ingredientId = searchParams.get("ingredientId")
  const movements = await prisma.stockMovement.findMany({
    where: ingredientId ? { ingredientId } : undefined,
    include: {
      ingredient: { select: { id: true, name: true, unit: true } },
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return NextResponse.json(movements)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER", "STAFF"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        ingredientId: body.ingredientId,
        type: body.type,
        quantity: body.quantity,
        cost: body.cost ?? null,
        note: body.note ?? null,
        reason: body.reason ?? null,
        fromBranchId: body.fromBranchId ?? null,
        toBranchId: body.toBranchId ?? null,
        supplierId: body.supplierId ?? null,
        performer: session.user?.name ?? session.user?.email ?? null,
      },
      include: { ingredient: { select: { id: true, name: true, unit: true } } },
    }),
    prisma.ingredient.update({
      where: { id: body.ingredientId },
      data: {
        currentQty: {
          [["PURCHASE", "ADJUSTMENT"].includes(body.type) ? "increment" :
            body.type === "WASTE" ? "decrement" :
            body.type === "TRANSFER" ? (body.fromBranchId ? "decrement" : "increment") :
            "decrement"]: body.quantity,
        },
      },
    }),
  ])

  return NextResponse.json(movement)
}
