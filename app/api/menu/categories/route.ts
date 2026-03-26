import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const cats = await prisma.category.findMany({ where: { isArchived: false }, orderBy: { sortOrder: "asc" } })
  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const cat = await prisma.category.create({
    data: { name: body.name, sortOrder: body.sortOrder ?? 0 },
  })
  return NextResponse.json(cat)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json()
  const cat = await prisma.category.update({
    where: { id: body.id },
    data: { name: body.name, sortOrder: body.sortOrder },
  })
  return NextResponse.json(cat)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !["ADMIN", "MANAGER"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  
  try {
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    // If physical delete fails (due to constraints), soft delete the category and its items
    try {
      await prisma.category.update({ where: { id }, data: { isArchived: true } })
      await prisma.menuItem.updateMany({ where: { categoryId: id }, data: { isArchived: true } })
      return NextResponse.json({ ok: true, softDeleted: true })
    } catch {
      return NextResponse.json({ error: "ไม่สามารถลบหรือซ่อนหมวดหมู่นี้ได้" }, { status: 500 })
    }
  }
}
