import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const tickets = await prisma.ticket.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const ticket = await prisma.ticket.create({
    data: {
      title: body.title,
      details: body.details ?? null,
      type: body.type ?? "GENERAL",
      status: "OPEN",
      branchId: body.branchId ?? null,
      createdBy: session.user?.name ?? session.user?.email ?? "Unknown",
    },
  })
  return NextResponse.json(ticket)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { id, action, responseNote, cancelNote } = body

  const statusMap: Record<string, string> = {
    acknowledge: "IN_PROGRESS",
    complete: "COMPLETED",
    reject: "REJECTED",
    cancel: "CANCELLED",
  }
  const newStatus = statusMap[action]
  if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  const canManage = ["ADMIN", "MANAGER"].includes(session.user?.role ?? "")
  if (action !== "cancel" && !canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      status: newStatus as never,
      responder: canManage ? (session.user?.name ?? session.user?.email ?? null) : undefined,
      responseNote: responseNote ?? null,
      cancelNote: cancelNote ?? null,
      updatedAt: new Date(),
    },
  })
  return NextResponse.json(ticket)
}
