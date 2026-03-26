import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const channel = await prisma.paymentChannel.create({
    data: {
      name: body.name,
      type: body.type,
      gpPercent: body.gpPercent,
      feePercent: body.feePercent,
      settlementDays: body.settlementDays,
    },
  })
  return NextResponse.json(channel)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const channel = await prisma.paymentChannel.update({
    where: { id: body.id },
    data: {
      name: body.name,
      type: body.type,
      gpPercent: body.gpPercent,
      feePercent: body.feePercent,
      settlementDays: body.settlementDays,
    },
  })
  return NextResponse.json(channel)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  try {
    await prisma.paymentChannel.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    // If has dependencies, soft delete instead
    await prisma.paymentChannel.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true, softDeleted: true })
  }
}
