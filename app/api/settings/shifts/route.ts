import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")
  const shifts = await prisma.shiftConfig.findMany({
    where: branchId && branchId !== "ALL" ? { branchId } : { branchId: null },
    orderBy: { startTime: "asc" },
  })
  return NextResponse.json(shifts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const shift = await prisma.shiftConfig.create({
    data: { 
      name: body.name, 
      startTime: body.startTime, 
      endTime: body.endTime,
      branchId: body.branchId && body.branchId !== "ALL" ? body.branchId : null
    },
  })
  return NextResponse.json(shift)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const shift = await prisma.shiftConfig.update({
    where: { id: body.id },
    data: { 
      name: body.name, 
      startTime: body.startTime, 
      endTime: body.endTime,
      branchId: body.branchId && body.branchId !== "ALL" ? body.branchId : null
    },
  })
  return NextResponse.json(shift)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.shiftConfig.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
