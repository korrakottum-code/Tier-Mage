import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  if (!body.email || !body.password) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) return NextResponse.json({ error: "อีเมลนี้ถูกใช้แล้ว" }, { status: 400 })

  const passwordHash = await bcrypt.hash(body.password, 10)
  const user = await prisma.user.create({
    data: { email: body.email, passwordHash, role: body.role ?? "STAFF" },
    include: { employee: { select: { name: true, branchId: true } } },
  })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = { email: body.email, role: body.role }
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10)

  const user = await prisma.user.update({
    where: { id: body.id },
    data,
    include: { employee: { select: { name: true, branchId: true } } },
  })
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  if (id === session.user.id) return NextResponse.json({ error: "ไม่สามารถลบตัวเองได้" }, { status: 400 })
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
