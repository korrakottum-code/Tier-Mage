import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  const body = await req.json()
  const { menuItemId, name, choices, priceModifier } = body
  
  if (!menuItemId || !name || !choices || !Array.isArray(choices)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const option = await prisma.menuOption.create({
    data: {
      menuItemId,
      name,
      choices,
      priceModifier: priceModifier || []
    }
  })
  return NextResponse.json(option)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await prisma.menuOption.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
