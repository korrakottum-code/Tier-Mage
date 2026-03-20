import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const shiftClosingId = formData.get("shiftClosingId") as string | null
  const channelId = formData.get("channelId") as string | null
  const amount = formData.get("amount") as string | null

  if (!file || !shiftClosingId || !amount) {
    return NextResponse.json({ error: "file, shiftClosingId, and amount required" }, { status: 400 })
  }

  const employee = await prisma.employee.findFirst({
    where: { user: { id: session.user?.id } },
  })
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 })

  // Convert file to base64 data URL for storage (no external storage dependency)
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")
  const mimeType = file.type || "application/octet-stream"
  const fileUrl = `data:${mimeType};base64,${base64}`

  const slip = await prisma.slipUpload.create({
    data: {
      shiftClosingId,
      channelId: channelId || null,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      amount: Number(amount),
      uploadedById: employee.id,
    },
  })

  return NextResponse.json({
    id: slip.id,
    fileName: slip.fileName,
    fileSize: slip.fileSize,
    amount: Number(slip.amount),
    uploadedAt: slip.uploadedAt,
  })
}
