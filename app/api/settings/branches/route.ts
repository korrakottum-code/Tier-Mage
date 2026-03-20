import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const branch = await prisma.branch.create({
    data: { name: body.name, type: body.type ?? "Branch", address: body.address, phone: body.phone },
  })
  return NextResponse.json(branch)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const branch = await prisma.branch.update({
    where: { id: body.id },
    data: { name: body.name, type: body.type, address: body.address, phone: body.phone },
  })
  return NextResponse.json(branch)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  
  try {
    // ลบจริงๆ แทนที่จะเป็น soft delete เพื่อให้สามารถลบข้อมูล import ได้
    await prisma.branch.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    // ถ้าลบไม่ได้เพราะมีข้อมูลอ้างอิง ให้ทำ soft delete แทน
    await prisma.branch.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true, softDeleted: true })
  }
}
