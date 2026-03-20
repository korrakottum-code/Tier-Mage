import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const settings = await prisma.shopSettings.upsert({
    where: { id: "shop-main" },
    update: {
      shopName: body.shopName,
      address: body.address,
      phone: body.phone,
      taxId: body.taxId,
      receiptHeader: body.receiptHeader,
      receiptFooter: body.receiptFooter,
    },
    create: {
      id: "shop-main",
      shopName: body.shopName,
      address: body.address,
      phone: body.phone,
      taxId: body.taxId,
      receiptHeader: body.receiptHeader,
      receiptFooter: body.receiptFooter,
    },
  })
  return NextResponse.json(settings)
}
